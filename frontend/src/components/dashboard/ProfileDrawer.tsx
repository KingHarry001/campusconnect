// src/components/dashboard/ProfileDrawer.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  X,
  User,
  Sun,
  Moon,
  Monitor,
  Bot,
  Info,
  LogOut,
  ChevronRight,
  ChevronDown,
  Check,
  MessageCircle,
  LucideIcon,
  Newspaper,
} from "lucide-react";
import ComplaintModal from "@/components/dashboard/ComplaintModal";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  secondaryTabs?: Tab[];
  active?: string;
  onSelectTab?: (key: string) => void;
}

const THEME_OPTIONS = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "system", icon: Monitor, label: "Auto" },
] as const;

export default function ProfileDrawer({
  open,
  onClose,
  secondaryTabs = [],
  active,
  onSelectTab,
}: ProfileDrawerProps) {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) setThemeMenuOpen(false);
  }, [open]);

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Bot, label: "AI Assistant", href: "/ai-settings" },
    { icon: Info, label: "About Campus Connect", href: "/about" },
  ];

  const activeThemeOption =
    THEME_OPTIONS.find((t) => t.key === theme) ?? THEME_OPTIONS[2];

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  };

  const selectTab = (key: string) => {
    onSelectTab?.(key);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
              className="fixed top-0 right-0 h-full w-[300px] max-w-[85vw] glass-panel border-l border-y-0 border-r-0 rounded-none z-50 flex flex-col shadow-lifted dark:shadow-lifted-dark"
            >
              {/* Profile header */}
              <div className="relative px-6 pt-8 pb-6 dot-grid">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/10 ring-4 ring-brand-green/15 shadow-glow flex items-center justify-center text-xl font-medium overflow-hidden mb-4 text-gray-900 dark:text-white">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile?.full_name?.[0] || "?"
                  )}
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {profile?.full_name}
                </p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  {profile?.email}
                </p>
                {profile?.role && (
                  <span className="inline-block mt-2 text-[10px] font-mono uppercase tracking-wider font-medium text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-2.5 py-1">
                    {profile.role}
                  </span>
                )}
              </div>

              <div className="trace-divider" />

              <div className="flex-1 overflow-y-auto py-2">
                {/* Secondary dashboard tabs — mobile/tablet's only way to reach these,
                    since the bottom nav is capped at 4. Only rendered when provided. */}
                {secondaryTabs.length > 0 && (
                  <>
                    <p className="px-6 pt-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-gray-400 lg:hidden">
                      Dashboard
                    </p>
                    <div className="lg:hidden">
                      {secondaryTabs.map(({ key, label, icon: Icon }) => {
                        const isActive = active === key;
                        return (
                          <button
                            key={key}
                            onClick={() => selectTab(key)}
                            className={`w-full flex items-center justify-between px-6 py-3.5 text-sm transition ${
                              isActive
                                ? "text-brand-green font-medium bg-brand-green/5"
                                : "text-gray-700 dark:text-gray-200 hover:bg-brand-green/5"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <Icon
                                size={18}
                                strokeWidth={1.75}
                                className={
                                  isActive
                                    ? "text-brand-green"
                                    : "text-gray-400"
                                }
                              />
                              {label}
                            </span>
                            {isActive && (
                              <Check size={15} className="text-brand-green" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mx-6 trace-divider opacity-40 lg:hidden" />
                  </>
                )}

                {menuItems.map(({ icon: Icon, label, href }, i) => (
                  <div key={label}>
                    {i > 0 && <div className="mx-6 trace-divider opacity-40" />}
                    <Link
                      href={href}
                      onClick={onClose}
                      className="flex items-center justify-between px-6 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-green/5 transition"
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={1.75}
                          className="text-gray-400"
                        />
                        {label}
                      </span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </Link>
                  </div>
                ))}

                <div className="mx-6 trace-divider opacity-40" />
                <button
                  onClick={() => selectTab("news")}
                  className={`w-full flex items-center justify-between px-6 py-3.5 text-sm transition ${
                    active === "news"
                      ? "text-brand-green font-medium bg-brand-green/5"
                      : "text-gray-700 dark:text-gray-200 hover:bg-brand-green/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Newspaper
                      size={18}
                      strokeWidth={1.75}
                      className={
                        active === "news" ? "text-brand-green" : "text-gray-400"
                      }
                    />
                    News
                  </span>
                  {active === "news" ? (
                    <Check size={15} className="text-brand-green" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-300" />
                  )}
                </button>

                <div className="mx-6 trace-divider opacity-40" />

                {/* Appearance */}
                <div>
                  <button
                    onClick={() => setThemeMenuOpen((v) => !v)}
                    aria-expanded={themeMenuOpen}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-green/5 transition"
                  >
                    <span className="flex items-center gap-3">
                      <Sun
                        size={18}
                        strokeWidth={1.75}
                        className="text-gray-400"
                      />
                      Appearance
                    </span>
                    <span className="flex items-center gap-2 text-gray-400">
                      {mounted && (
                        <span className="text-xs font-mono">
                          {activeThemeOption.label}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          themeMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mounted && themeMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-2 pt-1">
                          <div className="ml-[30px] rounded-2xl glass-panel shadow-soft dark:shadow-soft-dark overflow-hidden">
                            {THEME_OPTIONS.map(({ key, icon: Icon, label }) => {
                              const selected = theme === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setTheme(key);
                                    setThemeMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition ${
                                    selected
                                      ? "text-brand-green font-medium bg-brand-green/5"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                  }`}
                                >
                                  <span className="flex items-center gap-2.5">
                                    <Icon size={15} strokeWidth={1.75} />
                                    {label}
                                  </span>
                                  {selected && (
                                    <Check
                                      size={15}
                                      className="text-brand-green"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {profile?.role === "student" && (
                  <>
                    <div className="mx-6 trace-divider opacity-40" />
                    <button
                      onClick={() => {
                        onClose();
                        setComplaintOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-6 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-green/5 transition"
                    >
                      <span className="flex items-center gap-3">
                        <MessageCircle
                          size={18}
                          strokeWidth={1.75}
                          className="text-gray-400"
                        />
                        Submit Complaint
                      </span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  </>
                )}
              </div>

              <div className="trace-divider" />

              <div className="px-6 py-5">
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 font-medium py-2 disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-950/20 -mx-2 px-2 rounded-xl transition w-full"
                >
                  <LogOut size={18} strokeWidth={1.75} />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ComplaintModal
        open={complaintOpen}
        onClose={() => setComplaintOpen(false)}
      />
    </>
  );
}
