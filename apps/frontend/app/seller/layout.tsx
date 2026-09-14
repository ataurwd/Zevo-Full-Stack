"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { Loader2 } from "lucide-react";
import { getMySellerProfile } from "../../lib/api/sellers";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!isLoading) {
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      if (user.role !== "SELLER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }

      // If user is SELLER, check approval status
      if (user.role === "SELLER") {
        getMySellerProfile()
          .then((profile) => {
            if (!isMounted) return;
            if (profile && profile.status === "approved") {
              if (pathname === "/seller/pending-approval") {
                router.replace("/seller/orders");
              }
            } else {
              // Unapproved/pending/rejected seller
              if (pathname !== "/seller/pending-approval") {
                router.replace("/seller/pending-approval");
              }
            }
          })
          .catch(() => {
            if (!isMounted) return;
            if (pathname !== "/seller/pending-approval") {
              router.replace("/seller/pending-approval");
            }
          })
          .finally(() => {
            if (isMounted) setIsVerifying(false);
          });
      } else {
        if (isMounted) setIsVerifying(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, isLoading, router, pathname]);

  if (isLoading || (user?.role === "SELLER" && isVerifying && pathname !== "/seller/pending-approval")) {
    return (
      <div className="min-h-screen bg-[#073A36] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A86B]" />
        <p className="text-xs font-mono text-emerald-200">Verifying Merchant Clearance...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Pending approval screen is standalone without the merchant sidebar shell
  if (pathname === "/seller/pending-approval") {
    return <>{children}</>;
  }

  return <DashboardShell activeRole="SELLER">{children}</DashboardShell>;
}
