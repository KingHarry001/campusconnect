// src/app/student/layout.tsx
import RoleGate from "@/components/RoleGate";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["student"]}>{children}</RoleGate>;
}