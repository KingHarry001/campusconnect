// src/components/RoleGate.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLoader from "@/components/ui/AppLoader";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  student: "/student/dashboard",
  lecturer: "/lecturer/dashboard",
  admin: "/admin/dashboard",
};

export default function RoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"student" | "lecturer" | "admin">;
  children: React.ReactNode;
}) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/signin");
      return;
    }
    if (!profile) return; // profile still fetching, wait

    if (profile.status === "pending_approval" || profile.status === "banned") {
      router.replace("/pending");
      return;
    }
    if (!allowedRoles.includes(profile.role)) {
      router.replace(DASHBOARD_BY_ROLE[profile.role] ?? "/signin");
    }
  }, [session, profile, loading, allowedRoles, router]);

  const blocked =
    !session ||
    !profile ||
    profile.status !== "active" ||
    !allowedRoles.includes(profile.role);

  if (loading || blocked) {
    return <AppLoader />;
  }

  return <>{children}</>;
}
