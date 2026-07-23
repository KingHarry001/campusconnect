// src/app/pending/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { Clock, Ban, LogOut } from "lucide-react";

export default function PendingPage() {
  const { profile, signOut } = useAuth();

  const isBanned = profile?.status === "banned";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] dot-grid px-4">
      <div className="max-w-md w-full">
        <div className="glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark p-8 sm:p-10 text-center space-y-4">
          <div
            className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center border ${
              isBanned
                ? "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isBanned ? <Ban size={26} /> : <Clock size={26} />}
          </div>

          {isBanned ? (
            <>
              <h1 className="text-xl font-medium text-gray-900 dark:text-white">
                Account suspended
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your account has been suspended. If you believe this is a
                mistake, please contact the department admin.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-medium text-gray-900 dark:text-white">
                Awaiting approval
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your lecturer account is pending review by an admin. You'll
                get access to your dashboard once it's approved — this
                usually doesn't take long.
              </p>
              <div className="trace-divider !w-16 !mx-auto" />
              <p className="text-[11px] font-mono uppercase tracking-wider text-brand-green">
                status: pending_approval
              </p>
            </>
          )}

          <button
            onClick={signOut}
            className="mt-2 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}