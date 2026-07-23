// src/components/dashboard/DashboardLayout.tsx
"use client";

import { useState } from "react";
import { LucideIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProfileDrawer from "@/components/dashboard/ProfileDrawer";

interface Tab { key: string; label: string; icon: LucideIcon; }
interface DashboardLayoutProps {
  tabs: Tab[];              // primary — max 4, shown in mobile bottom bar + desktop sidebar
  secondaryTabs?: Tab[];    // overflow — desktop: "More" section in sidebar. Mobile: drawer only.
  active: string;
  setActive: (key: string) => void;
  title: string;
  portalLabel: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  tabs, secondaryTabs = [], active, setActive, title, portalLabel, children,
}: DashboardLayoutProps) {
  const { profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isSecondaryActive = secondaryTabs.some((t) => t.key === active);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors dot-grid">
      {/* Desktop sidebar */}
      <aside className="w-72 shrink-0 hidden lg:flex lg:flex-col justify-between p-4">
        <div className="glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark px-5 py-7 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 mb-10 px-1">
              <img src="/oou-crest.jpg" alt="" className="h-10 w-10 object-contain rounded-full ring-2 ring-brand-green/20" />
              <div className="leading-tight">
                <p className="font-medium text-sm text-gray-900 dark:text-white">Campus Connect</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-brand-green">{portalLabel}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              {tabs.map(({ key, label, icon: Icon }) => {
                const isActive = active === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                      isActive
                        ? "bg-brand-green/10 dark:bg-brand-green/15 text-brand-green shadow-glow"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Secondary tabs — collapsible "More" section, desktop only.
                Auto-expands if a secondary tab is the current active one. */}
            {secondaryTabs.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  More
                  <ChevronDown size={14} className={`transition-transform ${moreOpen || isSecondaryActive ? "rotate-180" : ""}`} />
                </button>
                {(moreOpen || isSecondaryActive) && (
                  <nav className="flex flex-col gap-1.5 mt-1">
                    {secondaryTabs.map(({ key, label, icon: Icon }) => {
                      const isActive = active === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setActive(key)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                            isActive
                              ? "bg-brand-green/10 dark:bg-brand-green/15 text-brand-green shadow-glow"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                          {label}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            )}
          </div>

          <div className="trace-divider mb-4 mt-4" />

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition text-left shadow-soft dark:shadow-soft-dark bg-white/50 dark:bg-white/[0.03]"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 ring-2 ring-brand-green/20 flex items-center justify-center text-sm font-medium overflow-hidden text-gray-900 dark:text-white">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile?.full_name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{profile?.full_name}</p>
              <p className="text-[11px] font-mono text-gray-400 truncate">{profile?.email}</p>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 sticky top-0 z-20 glass-panel border-x-0 border-t-0 rounded-none shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center gap-2.5">
            <img src="/oou-crest.jpg" alt="" className="h-8 w-8 object-contain rounded-full ring-2 ring-brand-green/20" />
            <div className="leading-tight">
              <p className="font-medium text-sm text-gray-900 dark:text-white">{title}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-brand-green">{portalLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 ring-2 ring-brand-green/20 flex items-center justify-center text-xs font-medium overflow-hidden text-gray-900 dark:text-white"
            aria-label="Open profile menu"
          >
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : profile?.full_name?.[0] || "?"}
          </button>
        </header>

        <header className="hidden lg:flex items-center justify-between px-12 pt-10">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white">{title}</h1>
            <p className="text-xs font-mono text-gray-400 mt-1">{portalLabel.toLowerCase()}</p>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-12 py-6 lg:py-10 pb-28 lg:pb-10 max-w-5xl w-full">
          {children}
        </main>

        {/* Mobile bottom nav — strictly the 4 primary tabs, never secondary ones */}
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-30 glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark px-1 py-2">
          <div className="flex justify-between">
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = active === key;
              return (
                <button key={key} onClick={() => setActive(key)} className="flex-1 flex flex-col items-center gap-1 py-1.5 px-1">
                  <div className={`p-1.5 rounded-xl transition ${isActive ? "bg-brand-green/15 shadow-glow" : ""}`}>
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-brand-green" : "text-gray-400"} />
                  </div>
                  <span className={`text-[10px] leading-none text-center ${isActive ? "text-brand-green font-medium" : "text-gray-400"}`}>
                    {label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        secondaryTabs={secondaryTabs}
        active={active}
        onSelectTab={setActive}
      />
    </div>
  );
}