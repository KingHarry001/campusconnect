// src/app/signup/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import GridBackground from "@/components/ui/GridBackground";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  level: string;
  phone: string;
  matricNumber: string;
  staffId: string;
  office: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  level: "100",
  phone: "",
  matricNumber: "",
  staffId: "",
  office: "",
};

const MATRIC_PATTERN = /^[A-Z]{3}\/\d{2}\/\d{2}\/\d{4}$/;

function formatMatricNumber(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let letters = "";
  let rest = "";
  for (const ch of clean) {
    if (letters.length < 3) {
      if (/[A-Z]/.test(ch)) letters += ch;
    } else {
      rest += ch;
    }
  }
  const digits = rest.replace(/[^0-9]/g, "").slice(0, 8);
  const year1 = digits.slice(0, 2);
  const year2 = digits.slice(2, 4);
  const serial = digits.slice(4, 8);
  let out = letters;
  if (year1) out += "/" + year1;
  if (year2) out += "/" + year2;
  if (serial) out += "/" + serial;
  return out;
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resume = searchParams.get("resume") === "true";
  const paramRole = searchParams.get("role") === "lecturer" ? "lecturer" : "student";

  // In resume mode the role comes from the account's existing metadata/profile
  // once loaded, not the URL — this local state holds that once fetched.
  const [resumeRole, setResumeRole] = useState<"student" | "lecturer">(paramRole);
  const role = resume ? resumeRole : paramRole;

  const [step, setStep] = useState<1 | 2>(resume ? 2 : 1);
  const [resumeLoading, setResumeLoading] = useState(resume);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // Resume mode: pull whatever the account already has (auth metadata plus
  // any partial public.users row) and pre-fill the form, skipping straight
  // to step 2 since the account itself already exists.
  useEffect(() => {
    if (!resume) return;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setAuthUserId(user.id);

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setExistingStatus(profile?.status ?? null);
      setResumeRole((profile?.role || user.user_metadata?.role || "student") as "student" | "lecturer");

      update({
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
        email: user.email || "",
        level: profile?.level || user.user_metadata?.level || "100",
        phone: profile?.phone || "",
        matricNumber: profile?.matric_number || "",
        staffId: profile?.staff_id || "",
        office: profile?.office || "",
      });

      setResumeLoading(false);
    };
    load();
  }, [resume, router]);

  const validateStepOne = () => {
    if (!form.fullName.trim()) {
      setError("Enter your full name.");
      return false;
    }
    if (!form.email.endsWith("@oouagoiwoye.edu.ng") && !form.email.endsWith("@student.oouagoiwoye.edu.ng")) {
      setError("Please use your school email (@oouagoiwoye.edu.ng)");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateStepOne()) return;
    setStep(2);
  };

  const handleBack = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "student" && !form.matricNumber.trim()) {
      setError("Enter your matric number.");
      return;
    }
    if (role === "student" && !MATRIC_PATTERN.test(form.matricNumber)) {
      setError("Matric number should look like EES/24/25/0000.");
      return;
    }
    if (role === "lecturer" && !form.staffId.trim()) {
      setError("Enter your staff ID.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Enter a phone number we can reach you on.");
      return;
    }

    setLoading(true);

    if (resume) {
      // Account already exists — no signUp() call, just fill/repair the
      // public.users row for this already-authenticated user.
      const payload = {
        id: authUserId,
        full_name: form.fullName.trim(),
        email: form.email,
        role,
        status: existingStatus || (role === "lecturer" ? "pending_approval" : "active"),
        phone: form.phone.trim(),
        level: role === "student" ? form.level : null,
        matric_number: role === "student" ? form.matricNumber.trim() : null,
        staff_id: role === "lecturer" ? form.staffId.trim() : null,
        office: role === "lecturer" ? form.office.trim() || null : null,
      };

      const { error: upsertError } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "id" });

      setLoading(false);

      if (upsertError) {
        if (upsertError.message.toLowerCase().includes("duplicate")) {
          setError(
            role === "student"
              ? "That matric number is already registered."
              : "That staff ID is already registered."
          );
        } else {
          setError(upsertError.message);
        }
        return;
      }

      if (payload.status === "pending_approval") router.push("/pending-approval");
      else if (role === "lecturer") router.push("/lecturer/dashboard");
      else router.push("/student/dashboard");
      return;
    }

    // Normal, brand-new sign-up path — unchanged from before.
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role,
          level: role === "student" ? form.level : null,
          phone: form.phone.trim(),
          matric_number: role === "student" ? form.matricNumber.trim() : null,
          staff_id: role === "lecturer" ? form.staffId.trim() : null,
          office: role === "lecturer" ? form.office.trim() || null : null,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("duplicate")) {
        setError(
          role === "student"
            ? "That matric number is already registered."
            : "That staff ID is already registered."
        );
      } else {
        setError(signUpError.message);
      }
      return;
    }

    router.push(role === "lecturer" ? "/pending-approval" : "/student/dashboard");
  };

  if (resumeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const renderSteps = (idSuffix: string) => (
    <>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 mb-5">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && !resume ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleContinue}
          >
            <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mb-6 text-sm font-medium">
              <Link
                href="/signup"
                className={`flex-1 text-center py-3 transition ${
                  role === "student" ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]" : "text-gray-600 dark:text-gray-400 dark:bg-white/5"
                }`}
              >
                Student
              </Link>
              <Link
                href="/signup?role=lecturer"
                className={`flex-1 text-center py-3 transition ${
                  role === "lecturer" ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]" : "text-gray-600 dark:text-gray-400 dark:bg-white/5"
                }`}
              >
                Lecturer
              </Link>
            </div>

            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`fullName-${idSuffix}`}>
              Full name
            </label>
            <input
              id={`fullName-${idSuffix}`}
              required
              placeholder="Ada Lovelace"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
              value={form.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
            />

            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`email-${idSuffix}`}>
              Email
            </label>
            <input
              id={`email-${idSuffix}`}
              type="email"
              required
              placeholder="you@oouagoiwoye.edu.ng"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
            />

            {role === "student" && (
              <>
                <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`level-${idSuffix}`}>
                  Level
                </label>
                <select
                  id={`level-${idSuffix}`}
                  className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-5"
                  value={form.level}
                  onChange={(e) => update({ level: e.target.value })}
                >
                  {["100", "200", "300", "400", "500"].map((l) => (
                    <option key={l} value={l}>{l} Level</option>
                  ))}
                </select>
              </>
            )}

            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`password-${idSuffix}`}>
              Password
            </label>
            <div className="relative mb-8">
              <input
                id={`password-${idSuffix}`}
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                value={form.password}
                onChange={(e) => update({ password: e.target.value })}
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
              type="submit"
              className="w-full bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full py-4 text-sm font-medium mb-6 shadow-soft dark:shadow-soft-dark hover:bg-gray-800 dark:hover:bg-gray-100 transition"
            >
              Continue
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="text-brand-green font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmit}
          >
            {!resume && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}

            {resume && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Signed in as <span className="font-medium text-gray-900 dark:text-white">{form.email}</span>
                </p>
                <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">I am a</label>
                <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mb-5 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setResumeRole("student")}
                    className={`flex-1 text-center py-3 transition ${
                      role === "student" ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeRole("lecturer")}
                    className={`flex-1 text-center py-3 transition ${
                      role === "lecturer" ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Lecturer
                  </button>
                </div>
              </>
            )}

            {role === "student" ? (
              <>
                <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`matricNumber-${idSuffix}`}>
                  Matric number
                </label>
                <input
                  id={`matricNumber-${idSuffix}`}
                  required
                  inputMode="text"
                  autoCapitalize="characters"
                  placeholder="EES/24/25/0000"
                  maxLength={16}
                  className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm font-mono tracking-wide mb-2 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                  value={form.matricNumber}
                  onChange={(e) => update({ matricNumber: formatMatricNumber(e.target.value) })}
                />
                <p className="text-xs text-gray-400 mb-5 font-mono">
                  Department code, admission year, level-entry year, then your serial number.
                </p>
              </>
            ) : (
              <>
                <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`staffId-${idSuffix}`}>
                  Staff ID
                </label>
                <input
                  id={`staffId-${idSuffix}`}
                  required
                  placeholder="OOU/STAFF/0456"
                  className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm font-mono mb-5 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                  value={form.staffId}
                  onChange={(e) => update({ staffId: e.target.value })}
                />

                <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`office-${idSuffix}`}>
                  Office <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id={`office-${idSuffix}`}
                  placeholder="Room 214, Engineering Building"
                  className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
                  value={form.office}
                  onChange={(e) => update({ office: e.target.value })}
                />
              </>
            )}

            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200" htmlFor={`phone-${idSuffix}`}>
              Phone number
            </label>
            <input
              id={`phone-${idSuffix}`}
              type="tel"
              required
              placeholder="080X XXX XXXX"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-green/30 transition"
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
            <p className="text-xs text-gray-400 mb-8">
              {role === "lecturer"
                ? "Used for attendance and student queries — visible to students in your classes."
                : "Used for attendance issues and account recovery — not shown to other students."}
            </p>

            <button
              disabled={loading}
              className="w-full bg-brand-green text-white rounded-full py-4 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 mb-6 shadow-glow hover:bg-brand-green-dark transition"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? (resume ? "Saving..." : "Creating account...") : resume ? "Finish setup" : "Create account"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col md:hidden transition-colors">
        <div className="relative bg-[#0a0a0a] px-6 pt-14 pb-10 rounded-b-[32px] overflow-hidden shadow-lifted-dark">
          <GridBackground size={32} />
          <div className="relative flex items-center gap-2 mb-8">
            <img src="/oou-crest.jpg" alt="" className="h-8 w-8 object-contain rounded-full ring-2 ring-brand-green/20" />
            <span className="text-white font-medium text-sm">Campus Connect</span>
          </div>
          <h1 className="relative text-white text-2xl font-medium leading-tight">
            {resume ? (
              <>Finish your <span className="font-voice italic font-normal text-green-400">setup</span></>
            ) : (
              <>Create your{" "}<span className="font-voice italic font-normal text-green-400">account</span></>
            )}
          </h1>
          <p className="relative text-white/50 text-sm mt-2 font-mono">
            {resume
              ? "A few details are missing from your registration."
              : step === 1
                ? "Sign up with your school email to get started."
                : "Just a couple more details."}
          </p>
          {!resume && (
            <div className="relative flex items-center gap-2 mt-6">
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-green-400" : "bg-white/15"}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-green-400" : "bg-white/15"}`} />
            </div>
          )}
        </div>

        <div className="flex-1 px-6 pt-6 pb-10 overflow-hidden">
          {renderSteps("mobile")}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="min-h-screen hidden md:grid md:grid-cols-2 dark:bg-[#0a0a0a] transition-colors">
        <div className="relative bg-[#0a0a0a] text-white px-10 lg:px-16 py-16 flex flex-col justify-between overflow-hidden">
          <GridBackground />
          <img
            src="/oou-crest.jpg"
            alt=""
            aria-hidden="true"
            className="absolute -right-16 -bottom-16 w-80 h-80 object-contain opacity-[0.06] pointer-events-none"
          />
          <div className="relative flex items-center gap-3">
            <img
              src="/oou-crest.jpg"
              alt="Olabisi Onabanjo University crest"
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
              Join the department{" "}
              <span className="font-voice italic font-normal text-green-400">on your terms</span>
            </h1>
            <p className="text-white/55 leading-relaxed">
              Whether you're tracking assignments as a student or running classes as a lecturer,
              Campus Connect gives you one dashboard built for how the department actually works.
            </p>
          </motion.div>
          <p className="relative text-xs text-white/30 font-mono">© 2026 Olabisi Onabanjo University</p>
        </div>

        <div className="flex items-center justify-center px-8 lg:px-16 py-16 bg-white dark:bg-[#0a0a0a] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-sm glass-panel rounded-3xl shadow-soft dark:shadow-soft-dark p-8"
          >
            <h2 className="text-3xl font-medium mb-2 text-gray-900 dark:text-white">
              {resume ? "Finish your setup" : "Create your account"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              {resume
                ? "A few details are missing from your registration."
                : step === 1
                  ? "Sign up with your school email to get started."
                  : "Just a couple more details."}
            </p>
            {!resume && (
              <div className="flex items-center gap-2 mb-8">
                <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-brand-green" : "bg-gray-100 dark:bg-white/10"}`} />
                <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-brand-green" : "bg-gray-100 dark:bg-white/10"}`} />
              </div>
            )}
            {resume && <div className="mb-8" />}
            {renderSteps("desktop")}
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}