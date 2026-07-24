// src/lib/profileCompleteness.ts
export function isProfileComplete(profile: any): boolean {
  if (!profile) return false;
  if (!profile.phone) return false;

  if (profile.role === "student") {
    return Boolean(profile.level && profile.matric_number);
  }
  if (profile.role === "lecturer") {
    return Boolean(profile.staff_id);
  }
  return true; // admins, or any other role, treated as complete by default
}