// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AuthGate from "@/components/AuthGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter, JetBrains_Mono } from "next/font/google";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Campus Connect | OOU Computer Engineering",
  description:
    "The official smart academic portal for the Department of Computer Engineering, Olabisi Onabanjo University. Manage schedules, attendance, assignments, and more.",
  keywords: ["OOU", "Computer Engineering", "Academic Portal", "SIWES", "Attendance"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-white dark:bg-[#0a0a0a] transition-colors`}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}