// src/app/about/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  ArrowLeft, CalendarClock, ClipboardCheck, Bell, GraduationCap, Users, ShieldCheck,
} from "lucide-react";
import Image from "next/image";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const stats: [string, string][] = [
  ["1,200+", "Students onboard"],
  ["40", "Courses tracked"],
  ["98%", "On-time submissions"],
];

const features = [
  {
    icon: CalendarClock,
    title: "Schedules that stay current",
    desc: "Timetable changes and rescheduled classes reach every affected student the moment a lecturer updates them.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance & assignments in one place",
    desc: "Mark attendance, track submissions, and see what's outstanding without chasing spreadsheets or group chats.",
  },
  {
    icon: Bell,
    title: "Department news that reaches you",
    desc: "Announcements from the department land directly in the portal — no more news buried in a WhatsApp group.",
  },
];

const roles = [
  {
    icon: GraduationCap,
    num: "01",
    role: "Student",
    desc: "See your timetable, submit assignments, track attendance, and catch every department announcement.",
    dark: true,
  },
  {
    icon: Users,
    num: "02",
    role: "Lecturer",
    desc: "Post schedules and materials, mark attendance, and reach your class instantly when something changes.",
    dark: false,
  },
  {
    icon: ShieldCheck,
    num: "03",
    role: "Admin",
    desc: "Oversee the department's courses, staff, and students from a single dashboard built for oversight.",
    dark: false,
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors">
      <header className="flex items-center gap-4 px-5 sm:px-8 py-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-medium text-gray-900 dark:text-white">About Campus Connect</h1>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 pb-24">
        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="rounded-[28px] bg-[#0a0a0a] dark:bg-white/[0.04] dark:border dark:border-white/10 text-white px-7 sm:px-10 pt-14 pb-12 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 80% -10%, rgba(74,222,128,0.18), transparent 55%)",
            }}
          />
          <Image
            src="/oou-crest.jpg"
            alt=""
            aria-hidden="true"
            className="absolute -right-10 -top-10 w-56 h-56 object-contain opacity-[0.06] pointer-events-none"
          />
          <div className="relative flex flex-col items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 border border-white/15 rounded-full px-4 py-1.5 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Department of Computer Engineering · OOU
            </span>
            <span className="text-xs text-white/35">
              A 2024/25 SIWES project · built in 9 weeks
            </span>
          </div>
          <h2 className="relative text-3xl sm:text-4xl font-medium leading-tight tracking-tight mb-5">
            Built for the department,
            <br />
            <span className="font-voice italic font-normal text-green-400">by the department</span>
          </h2>
          <p className="relative text-white/55 text-base max-w-md mx-auto leading-relaxed">
            Campus Connect replaces scattered group chats and paper registers with one
            shared system for schedules, attendance, assignments, and news.
          </p>
        </motion.section>

        {/* Stats */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={staggerContainer}
          className="grid grid-cols-3 border-y border-gray-100 dark:border-white/10 my-14"
        >
          {stats.map(([stat, label], i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className={`text-center py-8 ${i < 2 ? "border-r border-gray-100 dark:border-white/10" : ""}`}
            >
              <p className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 dark:text-white">{stat}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="bg-gray-50 dark:bg-white/5 rounded-[24px] p-7"
            >
              <div className="h-11 w-11 rounded-xl bg-green-400/10 flex items-center justify-center mb-5">
                <Icon size={20} className="text-green-700 dark:text-green-400" strokeWidth={1.5} />
              </div>
              <p className="text-base font-medium mb-2 text-gray-900 dark:text-white">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* Roles */}
        <section className="mb-16">
          <p className="text-xs uppercase tracking-widest text-gray-400 text-center mb-2">
            How it works
          </p>
          <h3 className="text-2xl font-medium text-center mb-10 text-gray-900 dark:text-white">
            Three roles, one system
          </h3>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            {roles.map(({ icon: Icon, num, role, desc, dark }) => (
              <motion.div
                key={role}
                variants={fadeUp}
                className={`rounded-[24px] p-7 ${
                  dark ? "bg-[#0f2a06] text-white" : "bg-gray-50 dark:bg-white/5"
                }`}
              >
                <span className={`text-sm ${dark ? "text-green-400" : "text-gray-400"}`}>{num}</span>
                <Icon
                  size={28}
                  className={`my-4 ${dark ? "text-green-400" : "text-green-700 dark:text-green-400"}`}
                  strokeWidth={1.5}
                />
                <p className={`text-lg font-medium mb-2 ${dark ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {role}
                </p>
                <p className={`text-sm leading-relaxed ${dark ? "text-white/60" : "text-gray-500 dark:text-gray-400"}`}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Project background */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="bg-gray-50 dark:bg-white/5 rounded-[24px] p-8 sm:p-10 mb-16 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">The project</p>
          <p className="text-base text-gray-700 dark:text-gray-200 max-w-lg mx-auto leading-relaxed">
            Campus Connect started as a{" "}
            <span className="font-medium text-gray-900 dark:text-white">2024/25 SIWES project</span>,
            designed and built over <span className="font-medium text-gray-900 dark:text-white">9 weeks</span>{" "}
            by Computer Engineering students during their industrial training placement — built to solve a
            problem the department actually had, not just for the assignment.
          </p>
        </motion.section>

        {/* Support / footer note */}
        <section className="text-center border-t border-gray-100 dark:border-white/10 pt-10">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions or feedback about the portal?{" "}
            <a
              href="mailto:support@campusconnect.oou.edu.ng"
              className="text-gray-900 dark:text-white font-medium underline underline-offset-4 decoration-gray-300 dark:decoration-white/20"
            >
              Reach the team
            </a>
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-3">Campus Connect · v1.0 · SIWES 2024/25</p>
        </section>
      </main>
    </div>
  );
}