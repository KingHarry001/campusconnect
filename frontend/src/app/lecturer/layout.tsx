// src/app/lecturer/layout.tsx
import RoleGate from "@/components/RoleGate";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["lecturer"]}>{children}</RoleGate>;
}