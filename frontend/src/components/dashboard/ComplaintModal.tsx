"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAcademicCalendar } from "@/hooks/useAcademicCalendar";

export default function ComplaintModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { calendar } = useAcademicCalendar();
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [form, setForm] = useState({
    lecturerId: "",
    courseId: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile?.id) return;
    const load = async () => {
      setLoadingMine(true);
      let courseQuery = supabase.from("courses").select("id, code, title").eq("level", profile.level);
      if (calendar) courseQuery = courseQuery.eq("session", calendar.session).eq("semester", calendar.semester);

      const [{ data: lecs }, { data: crs }, { data: myComplaints }] = await Promise.all([
        supabase.from("users").select("id, full_name").eq("role", "lecturer"),
        courseQuery,
        supabase
          .from("complaints")
          .select("*, lecturer:users!lecturer_id(full_name), courses(code)")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false }),
      ]);
      setLecturers(lecs || []);
      setCourses(crs || []);
      setMine(myComplaints || []);
      setLoadingMine(false);
    };
    load();
  }, [open, profile?.id, profile?.level, calendar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!profile) {
      setError(
        "Your profile hasn't loaded yet — please try again in a moment.",
      );
      return;
    }

    if (!form.lecturerId || !form.subject.trim() || !form.message.trim()) {
      setError("Pick a lecturer and fill in the subject and message.");
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("complaints")
      .insert({
        student_id: profile.id,
        lecturer_id: form.lecturerId,
        course_id: form.courseId || null,
        subject: form.subject,
        message: form.message,
        status: "open",
      })
      .select("*, lecturer:users!lecturer_id(full_name), courses(code)")
      .single();
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setMine([data, ...mine]);
    setForm({ lecturerId: "", courseId: "", subject: "", message: "" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="relative dot-grid px-6 sm:px-8 py-6 shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shadow-glow">
                    <MessageCircle size={18} className="text-brand-green" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Submit a complaint
                    </h2>
                    <p className="text-xs font-mono text-gray-400">
                      Send an official message to a lecturer
                    </p>
                  </div>
                </div>
              </div>

              <div className="trace-divider" />

              <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 gap-6 p-6 sm:p-8">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200"
                        htmlFor="lecturer"
                      >
                        Lecturer
                      </label>
                      <select
                        id="lecturer"
                        className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                        value={form.lecturerId}
                        onChange={(e) =>
                          setForm({ ...form, lecturerId: e.target.value })
                        }
                      >
                        <option value="">Select lecturer</option>
                        {lecturers.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200"
                        htmlFor="course"
                      >
                        Course (optional)
                      </label>
                      <select
                        id="course"
                        className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                        value={form.courseId}
                        onChange={(e) =>
                          setForm({ ...form, courseId: e.target.value })
                        }
                      >
                        <option value="">Select course</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200"
                      htmlFor="subject"
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                      placeholder="Short summary"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200"
                      htmlFor="message"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm h-28 focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                      placeholder="Describe your concern..."
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Sending..." : "Send complaint"}
                  </button>
                </form>

                {/* History */}
                <div className="lg:border-l lg:border-gray-100 dark:lg:border-white/10 lg:pl-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    My complaints
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Recent submissions and their status
                  </p>
                  {loadingMine ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : mine.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <MessageCircle
                        size={26}
                        className="text-gray-200 dark:text-gray-700 mb-3"
                        strokeWidth={1.5}
                      />
                      <p className="text-sm text-gray-400">
                        Nothing submitted yet
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {mine.map((c: any) => (
                        <li
                          key={c.id}
                          className="border border-gray-100 dark:border-white/10 rounded-2xl p-4"
                        >
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {c.subject}
                            </p>
                            <span
                              className={`shrink-0 text-xs font-mono px-2.5 py-1 rounded-full font-medium ${
                                c.status === "resolved"
                                  ? "bg-brand-green/10 text-brand-green"
                                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            To {c.lecturer?.full_name || "—"}
                            {c.courses?.code ? ` · ${c.courses.code}` : ""}
                          </p>
                          {c.reply && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                              Reply: {c.reply}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
