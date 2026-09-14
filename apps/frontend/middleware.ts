import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get("zevo_token")?.value || request.cookies.get("nexora_token")?.value;
  const role = request.cookies.get("zevo_role")?.value || request.cookies.get("nexora_role")?.value;

  // 1. Authenticated User Protection on Auth Routes (/login, /register)
  // When user is already logged in, they MUST NOT be able to visit login or register
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      const redirectParam = searchParams.get("redirect");
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("/login") &&
        !redirectParam.startsWith("/register")
      ) {
        return NextResponse.redirect(new URL(redirectParam, request.url));
      }

      // Role-based destination
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "SELLER") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (role === "DELIVERY_AGENT") {
        return NextResponse.redirect(new URL("/delivery/dashboard", request.url));
      }
      // Default: Home page
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 2. Strict Admin Route Guard (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Non-admin attempting to access admin portal
    if (role && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Strict Seller / Merchant Dashboard Route Guard (/dashboard/*, /seller/*)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/seller")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-check if customer tries to access seller dashboard
    if (role && role === "CUSTOMER") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // 4. Strict Rider / Delivery Route Guard (/delivery/*)
  if (pathname.startsWith("/delivery")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role && (role === "CUSTOMER" || role === "SELLER")) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // 5. Customer Protected Routes (/orders/*, /checkout/*, /chat/*)
  if (pathname.startsWith("/orders") || pathname.startsWith("/checkout") || pathname.startsWith("/chat")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/dashboard/:path*",
    "/seller/:path*",
    "/delivery/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/chat/:path*",
  ],
};
