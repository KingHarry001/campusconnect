// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Replace this with your actual deployed website URL
    const APP_WEBSITE_URL = "https://your-live-website-url.com"; 

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_WEBSITE_URL}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-medium mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              We sent a password reset link to {email}. Follow the link to set a new password.
            </p>
            <Link href="/signin" className="text-sm text-green-600 font-medium">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="text-2xl font-medium mb-2">Reset your password</h1>
            <p className="text-sm text-gray-500 mb-8">
              Enter your school email and we'll send you a reset link.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5">{error}</p>
            )}

            <label className="text-sm font-medium block mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@oouagoiwoye.edu.ng"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-green-400/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              disabled={loading}
              className="w-full bg-green-500 text-white rounded-full py-4 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/signin" className="text-green-600 font-medium">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}