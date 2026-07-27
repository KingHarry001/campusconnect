// src/app/signin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import GridBackground from "@/components/ui/GridBackground";
import Image from "next/image";
import crestImage from "../../../public/oou-crest.jpg";

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); // Added to prevent form flash

  // 1. Check if the user is already logged in when the page loads
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await routeUser(session.user.id);
      } else {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  // 2. Extracted your routing logic to keep things DRY
  const routeUser = async (userId: string) => {
    const { data: profile } = await supabase
      .from("users")
      .select("role, status, phone, level, matric_number, staff_id")
      .eq("id", userId)
      .maybeSingle();

    setLoading(false);

    if (!profile) {
      router.push("/signup?resume=true");
      return;
    }

    if (profile.status === "banned") {
      setError("This account has been suspended. Contact department admin.");
      setCheckingSession(false);
      return;
    }

    const missingRequiredFields =
      !profile.phone ||
      (profile.role === "student" && (!profile.level || !profile.matric_number)) ||
      (profile.role === "lecturer" && !profile.staff_id);

    if (missingRequiredFields) {
      router.push("/signup?resume=true");
      return;
    }

    if (profile.status === "pending_approval") {
      router.push("/pending-approval");
      return;
    }

    if (profile.role === "admin") router.push("/admin/dashboard");
    else if (profile.role === "lecturer") router.push("/lecturer/dashboard");
    else router.push("/student/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      await routeUser(data.user.id);
    }
  };

  const renderFormFields = (idSuffix: string) => (
    <>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 mb-6">
          {error}
        </p>
      )}

      <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`email-${idSuffix}`}>
        Email
      </label>
      <input
        id={`email-${idSuffix}`}
        type="email"
        required
        placeholder="you@oouagoiwoye.edu.ng"
        className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-200" htmlFor={`password-${idSuffix}`}>
          Password
        </label>
        <Link href="/forgot-password" className="text-xs text-brand-green font-medium hover:underline">
          Forgot password?
        </Link>
      </div>
      <div className="relative mb-8">
        <input
          id={`password-${idSuffix}`}
          type={showPassword ? "text" : "password"}
          required
          className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <button
        disabled={loading}
        className="w-full bg-brand-green text-white rounded-full py-4 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 mb-6 shadow-glow hover:bg-brand-green-dark transition"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        New here?{" "}
        <Link href="/signup" className="text-brand-green font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );

  // 3. Show a loader while we check if they are already logged in
  // so the login form doesn't flicker before the redirect happens
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col md:hidden transition-colors">
        <div className="relative bg-[#0a0a0a] px-6 pt-14 pb-10 rounded-b-[32px] overflow-hidden shadow-lifted-dark">
          <GridBackground size={32} />
          <div className="relative flex items-center gap-2 mb-8">
            <Image
              src={crestImage}
              alt="Olabisi Onabanjo University crest"
              width={32} 
              height={32}
              className="h-10 w-10 object-contain rounded-full ring-2 ring-brand-green/20"
            />
            <span className="text-white font-medium text-sm">Campus Connect</span>
          </div>
          <h1 className="relative text-white text-2xl font-medium leading-tight">
            Welcome <span className="font-voice italic font-normal text-green-400">back</span>
          </h1>
          <p className="relative text-white/50 text-sm mt-2 font-mono">Sign in to continue to your dashboard.</p>
        </div>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="flex-1 px-6 pt-8 pb-10"
        >
          {renderFormFields("mobile")}
        </motion.form>
      </div>

      {/* Desktop layout */}
      <div className="min-h-screen hidden md:grid md:grid-cols-2 dark:bg-[#0a0a0a] transition-colors">
        <div className="relative bg-[#0a0a0a] text-white px-10 lg:px-16 py-16 flex flex-col justify-between overflow-hidden">
          <GridBackground />
          <div className="relative flex items-center gap-3">
            <Image
              src={crestImage}
              alt="Olabisi Onabanjo University crest"
              width={32} 
              height={32}
              className="h-10 w-10 object-contain rounded-full ring-2 ring-brand-green/20"
            />
            <span className="font-medium">Campus Connect</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative max-w-md"
          >
            <h1 className="text-4xl lg:text-5xl font-medium leading-tight mb-6">
              Navigate university life{" "}
              <span className="font-voice italic font-normal text-green-400">with clarity</span>
            </h1>
            <p className="text-white/55 leading-relaxed">
              One home for schedules, attendance, assignments, complaints and the latest news from the Department of Computer Engineering.
            </p>
          </motion.div>
          <p className="relative text-xs text-white/30 font-mono">© 2026 Olabisi Onabanjo University</p>
        </div>

        <div className="flex items-center justify-center px-8 lg:px-16 py-16 bg-white dark:bg-[#0a0a0a]">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="w-full max-w-sm glass-panel rounded-3xl shadow-soft dark:shadow-soft-dark p-8"
          >
            <h2 className="text-3xl font-medium mb-2 text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10">Sign in to continue to your dashboard.</p>
            {renderFormFields("desktop")}
          </motion.form>
        </div>
      </div>
    </>
  );
}