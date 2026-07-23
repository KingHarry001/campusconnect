// src/app/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/signin");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl font-medium mb-2">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-8">Choose a new password for your account.</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5">{error}</p>
        )}

        <label className="text-sm font-medium block mb-2" htmlFor="password">New password</label>
        <div className="relative mb-8">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <button
          disabled={loading}
          className="w-full bg-green-500 text-white rounded-full py-4 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}