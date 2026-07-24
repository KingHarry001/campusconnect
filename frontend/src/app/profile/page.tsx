// src/app/profile/page.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Mail,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

// Matches database/schema.sql — a single `public.users` table (not `profiles`)
// holds every field, keyed by the auth.users id.
const USERS_TABLE = "users";
const AVATAR_BUCKET = "avatars";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile?.full_name?.[0] || "?";

  // Real columns from database/schema.sql's public.users table. Cast here
  // only because we don't have your AuthContext's exact TS type in this
  // file — the field names themselves are the actual schema, not a guess.
  const extra = profile as unknown as {
    id?: string;
    matric_number?: string;
    staff_id?: string;
    department?: string;
    level?: string;
    phone?: string;
    office?: string;
    academic_adviser?: string;
    status?: string;
    created_at?: string;
  } | null;

  const isLecturer = profile?.role === "lecturer";

  const memberSince = extra?.created_at
    ? new Date(extra.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !extra?.id) return;

    setUploadingAvatar(true);
    setBanner(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${extra.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(path);
      const newUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from(USERS_TABLE)
        .update({ avatar_url: newUrl })
        .eq("id", extra.id);
      if (updateError) throw updateError;

      setAvatarUrl(newUrl);
      setBanner({ type: "success", message: "Profile photo updated." });
      // If your AuthContext exposes a refresh method (e.g. refreshProfile()),
      // call it here so the rest of the app picks up the new avatar too.
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setBanner({
        type: "error",
        message: "Couldn't upload that photo. Try a smaller image.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!extra?.id) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const { error } = await supabase
        .from(USERS_TABLE)
        .update({ full_name: fullName.trim() })
        .eq("id", extra.id);
      if (error) throw error;

      setBanner({ type: "success", message: "Changes saved." });
      setEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      setBanner({
        type: "error",
        message: "Couldn't save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name ?? "");
    setEditing(false);
    setBanner(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 sm:px-8 py-6 max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-medium text-gray-900 dark:text-white">
          Profile
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
        {/* Identity card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-[28px] bg-[#0a0a0a] dark:bg-white/[0.04] dark:border dark:border-white/10 px-8 pt-10 pb-8 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-x-0 top-0 h-24 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% -20%, rgba(74,222,128,0.35), transparent 60%)",
            }}
          />

          <div className="relative inline-block">
            <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-medium overflow-hidden text-white ring-4 ring-white/10">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={handleAvatarPick}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-400 text-[#0a0a0a] flex items-center justify-center shadow-lg hover:bg-green-300 transition disabled:opacity-60"
              aria-label="Change profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <p className="relative mt-5 text-xl font-medium text-white">
            {profile?.full_name}
          </p>
          <p className="relative text-sm text-white/50 mt-1">
            {profile?.email}
          </p>

          {profile?.role && (
            <span className="relative inline-flex items-center gap-1.5 mt-4 text-[11px] uppercase tracking-wide font-medium text-green-400 bg-green-400/10 rounded-full px-3 py-1.5">
              <ShieldCheck size={12} />
              {profile.role}
            </span>
          )}
        </motion.section>

        {/* Inline feedback banner */}
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-5 rounded-xl px-4 py-3 text-sm ${
              banner.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {banner.message}
          </motion.div>
        )}

        {/* Account details */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Account details
            </p>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <Pencil size={14} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !fullName.trim()}
                  className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#0a0a0a] dark:bg-white dark:text-[#0a0a0a] rounded-full px-4 py-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/10 overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-1.5">Full name</p>
              {editing ? (
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-white/20 pb-1.5 focus:outline-none focus:border-green-400"
                  autoFocus
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.full_name}
                </p>
              )}
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {profile?.email}
              </p>
            </div>

            {extra?.department && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Department</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.department}
                </p>
              </div>
            )}

            {!isLecturer && extra?.matric_number && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Matric number</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.matric_number}
                </p>
              </div>
            )}

            {!isLecturer && extra?.level && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Level</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.level} Level
                </p>
              </div>
            )}

            {!isLecturer && extra?.academic_adviser && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Academic adviser</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.academic_adviser}
                </p>
              </div>
            )}

            {isLecturer && extra?.staff_id && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Staff ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.staff_id}
                </p>
              </div>
            )}

            {isLecturer && extra?.office && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Office</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.office}
                </p>
              </div>
            )}

            {extra?.phone && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {extra.phone}
                </p>
              </div>
            )}

            {isLecturer && extra?.status === "pending_approval" && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Account status</p>
                <span className="inline-block text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2.5 py-1">
                  Pending admin approval
                </span>
              </div>
            )}

            {memberSince && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-1.5">Member since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {memberSince}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Danger zone */}
        <section className="mt-10">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign out of Campus Connect
          </button>
        </section>
      </main>
    </div>
  );
}
