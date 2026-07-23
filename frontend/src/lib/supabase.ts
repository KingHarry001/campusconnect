// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Check .env.local and rebuild — env vars are baked in at build time."
  );
}

// Capacitor Preferences-backed storage adapter, for reliable session
// persistence across app kills on native. Falls back to localStorage
// on web, where Preferences isn't needed and localStorage is fine.
const capacitorStorageAdapter = {
  getItem: async (key: string) => {
    if (!Capacitor.isNativePlatform()) {
      return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    }
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
      return;
    }
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});