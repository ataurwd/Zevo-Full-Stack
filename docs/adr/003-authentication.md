# ADR 003 — JWT Authentication with Dual Token Strategy

## Date: 2024-01

## Status: Accepted

## Context
NEXORA serves 5 roles (SUPER_ADMIN, ADMIN, SELLER, DELIVERY_AGENT, CUSTOMER). Authentication must be secure, stateless (for horizontal scaling), and not vulnerable to common attacks.

## Problem
How to implement authentication tokens and where to store them?

## Decision
- **Access Token:** JWT, stored in memory (JS variable / React Context), 15-minute lifetime
- **Refresh Token:** JWT, stored in HttpOnly + Secure + SameSite=Lax cookie, 7-day lifetime
- **Rotation:** Refresh token rotated on every use

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Both tokens in localStorage | XSS can steal both tokens — unacceptable for production |
| Both tokens in HttpOnly cookies | Requires CSRF protection on every mutating request (double CSRF token complexity) |
| Sessions (server-side) | Stateful — requires shared session store for horizontal scaling |
| Access in memory + Refresh in cookie ✅ | Best security: XSS can't steal refresh, CSRF can't steal access (Bearer header) |

## Reasons
- Access token in memory: XSS cannot read it (not in DOM, not in localStorage)
- Refresh token in HttpOnly cookie: XSS cannot read it; CSRF cannot use it because API calls require `Authorization: Bearer` header, not the cookie
- `Path=/api/v1/auth/refresh` on cookie: limits CSRF surface further
- Short access token TTL (15min): limits blast radius of any compromise
- Stateless: scales horizontally without shared session storage

## Trade-offs

| Pros | Cons |
|---|---|
| XSS cannot steal refresh token | Access token lost on page refresh (must call /refresh) |
| CSRF cannot use refresh token alone | Extra /refresh call on page load |
| Stateless, scales horizontally | Refresh token rotation adds DB write on each refresh |
| Short-lived access token limits damage | Cannot immediately revoke all access tokens (wait 15min) |

## Consequences
- Frontend must handle the /refresh call on every page load (before accessing protected pages)
- On password reset, all active sessions must be invalidated via Redis blacklist
- Redis required for token blacklist (logout + force invalidation)

## Failure Cases
- If access token is compromised: valid for max 15 minutes before expiry
- If refresh token cookie is stolen via physical access: attacker can refresh; mitigation = rotate and blacklist
- If Redis is down: cannot verify blacklist; must choose between denying all refreshes (safe) or allowing (degraded)
