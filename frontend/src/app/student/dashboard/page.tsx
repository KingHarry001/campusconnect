"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutGrid,
  ClipboardList,
  CalendarCheck,
  MessageCircle,
  Newspaper,
  MapPin,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Camera,
  User,
  LogOut,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AttendanceCheckIn from "@/components/dashboard/AttendanceCheckIn";
import AIChatWidget from "@/components/dashboard/AIChatWidget";
import GridBackground from "@/components/ui/GridBackground";
import {
  SkeletonListRow,
  SkeletonStatCard,
} from "@/components/ui/SkeletonDashboardCard";
import { useAcademicCalendar } from "@/hooks/useAcademicCalendar";
import Image from "next/image";

const TABS = [
  { key: "overview", label: "Weekly Overview", icon: LayoutGrid },
  { key: "courses", label: "Courses", icon: ClipboardList },
  { key: "assignments", label: "Assignments", icon: ClipboardList },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
];

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ─── Shared skeleton block — matches the glass card shape used everywhere ─── */
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 animate-pulse ${className}`}
    >
      <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded-full mb-3" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-white/10 rounded-full mb-2" />
      <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/5 rounded-full" />
    </div>
  );
}

export default function StudentDashboard() {
  const {
    profile,
    loading: authLoading,
    session,
    refreshProfile,
    signOut,
  } = useAuth();
  const { calendar, loading: calendarLoading } = useAcademicCalendar();
  const [active, setActive] = useState("overview");

  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const fetchEnrollments = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("enrollments")
      .select(
        "*, course:courses(*, lecturer:users!lecturer_id(id, full_name, email, avatar_url), classes(id, day, start_time, end_time, location:locations(name, building)))",
      )
      .eq("student_id", profile.id);
    setEnrollments(data || []);
    setEnrollmentsLoading(false);
  };

  useEffect(() => {
    fetchEnrollments();
  }, [profile?.id]);

  const fetchData = useCallback(async () => {
    if (authLoading || calendarLoading) return;

    if (!profile?.level) {
      setClassesLoading(false);
      setAssignmentsLoading(false);
      return;
    }
    console.log("DEBUG level:", profile?.level, "calendar:", calendar);

    let courseQuery = supabase
      .from("courses")
      .select("id")
      .eq("level", profile.level);
    if (calendar) {
      courseQuery = courseQuery
        .eq("session", calendar.session)
        .eq("semester", calendar.semester);
    }
    const { data: levelCourses } = await courseQuery;
    const courseIds = (levelCourses || []).map((c: any) => c.id);

    if (courseIds.length === 0) {
      setClasses([]);
      setAssignments([]);
      setClassesLoading(false);
      setAssignmentsLoading(false);
      return;
    }

    const [{ data: classData }, { data: assignmentData }] = await Promise.all([
      supabase
        .from("classes")
        .select("*, courses(code, title, level), locations(name, building)")
        .in("course_id", courseIds),
      supabase
        .from("assignments")
        .select("*, courses(code, title)")
        .in("course_id", courseIds)
        .order("deadline", { ascending: true }),
    ]);

    setClasses(classData || []);
    setAssignments(assignmentData || []);
    setClassesLoading(false);
    setAssignmentsLoading(false);
  }, [authLoading, calendarLoading, calendar, profile?.level]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <DashboardLayout
        tabs={TABS}
        active={active}
        setActive={setActive}
        title="Student Dashboard"
        portalLabel="OOU · Computer Engineering"
      >
        {active === "overview" && (
          <WeeklyOverview
            profile={profile}
            classes={classes}
            loading={classesLoading}
            assignments={assignments}
            calendar={calendar}
          />
        )}
        {active === "courses" && (
          <CoursesView
            profile={profile}
            enrollments={enrollments}
            onRefresh={fetchEnrollments}
          />
        )}
        {active === "assignments" && (
          <AssignmentsView
            assignments={assignments}
            loading={assignmentsLoading}
            profile={profile}
          />
        )}
        {active === "attendance" && (
          <AttendanceView classes={classes} loading={classesLoading} />
        )}
        {active === "complaint" && <ComplaintForm profile={profile} />}
        {active === "news" && <NewsView />}
      </DashboardLayout>
      {/* <AIChatWidget /> */}

      {!authLoading && profile && !profile.avatar_url && (
        <AvatarUploadModal
          session={session}
          refreshProfile={refreshProfile}
          signOut={signOut}
        />
      )}
    </>
  );
}

/* ─── Weekly Overview ─── */
function WeeklyOverview({
  profile,
  classes,
  loading,
  assignments,
  calendar,
}: any) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const byDay = (day: string) => classes.filter((c: any) => c.day === day);
  const pending = assignments.filter(
    (a: any) => !a.deadline || new Date(a.deadline) >= new Date(),
  );
  const upcoming = pending.slice(0, 4);

  const levelMissing = !loading && !profile?.level;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative bg-[#0a0a0a] text-white rounded-3xl p-6 sm:p-10 overflow-hidden shadow-lifted-dark">
        <GridBackground size={40} />
        <p className="relative text-sm text-white/40 mb-2 font-mono">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h2 className="relative text-2xl sm:text-3xl font-medium mb-6">
          {greeting},{" "}
          <span className="font-voice italic font-normal text-green-400">
            {profile?.full_name?.split(" ")[0] || "there"}
          </span>
        </h2>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
            : [
                { label: "Classes this week", value: String(classes.length) },
                { label: "Pending assignments", value: String(pending.length) },
                {
                  label: "Term",
                  value: calendar
                    ? `Sem ${calendar.semester} · ${calendar.session}`
                    : "—",
                },
                {
                  label: "Level",
                  value: profile?.level ? `${profile.level} Level` : "—",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-h-[76px] flex flex-col justify-between"
                >
                  <p className="text-xs text-white/40 mb-1 leading-snug">
                    {s.label}
                  </p>
                  <p className="text-lg sm:text-xl font-mono font-medium text-green-400">
                    {s.value}
                  </p>
                </div>
              ))}
        </div>
      </div>

      {levelMissing && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl px-5 py-4 text-sm shadow-soft dark:shadow-soft-dark">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Your study level is not set
            </p>
            <p className="text-amber-700 mt-0.5">
              Your account doesn't have a level assigned yet (e.g. 100, 200, 300
              Level). Please contact the department administrator to update your
              profile.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly schedule */}
        <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Weekly schedule
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            All lectures for the coming week
          </p>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="flex items-start justify-between border-b border-gray-50 dark:border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-[11px] font-mono font-medium text-brand-green tracking-wide w-28 pt-0.5">
                    {day.toUpperCase()}
                  </p>
                  <div className="flex-1 text-right">
                    {byDay(day).length === 0 ? (
                      <p className="text-sm text-gray-300 dark:text-gray-600">
                        No classes
                      </p>
                    ) : (
                      byDay(day).map((c: any) => (
                        <p
                          key={c.id}
                          className="text-sm text-gray-700 dark:text-gray-200"
                        >
                          <span className="font-mono text-xs">
                            {c.courses?.code}
                          </span>{" "}
                          · {c.start_time}–{c.end_time}
                          {c.locations?.name ? ` · ${c.locations.name}` : ""}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Upcoming deadlines
          </h3>
          <p className="text-sm text-gray-400 mb-6">Next 4 assignments</p>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={28} className="text-green-200 mb-3" />
              <p className="text-sm text-gray-400">No upcoming deadlines 🎉</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((a: any) => (
                <li
                  key={a.id}
                  className="border-b border-gray-50 dark:border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    <span className="font-mono text-xs text-brand-green">
                      {a.courses?.code}
                    </span>{" "}
                    · {a.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    Due{" "}
                    {a.deadline
                      ? new Date(a.deadline).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


function CoursesView({ profile, enrollments, onRefresh }: any) {
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const enrolledIds = new Set(enrollments.map((e: any) => e.course?.id));

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("courses")
        .select(
          "*, lecturer:users!lecturer_id(id, full_name, email, avatar_url), classes(id, day, start_time, end_time, location:locations(name, building))"
        )
        .eq("level", profile?.level || "")
        .order("code");
      setAllCourses(data || []);
      setLoading(false);
    };
    if (profile?.level) load();
  }, [profile?.level]);

  const enroll = async (courseId: string) => {
  setActing(courseId);
  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id: profile.id, course_id: courseId });

  if (!error) {
    await onRefresh();
  } else if (error.code === "23505") {
    alert("You're already enrolled in this course.");
  } else if (error.code === "42501") {
    alert("You can't enroll in this course.");
  } else {
    alert("Failed to enroll: " + error.message);
  }
  setActing(null);
};

const drop = async (courseId: string) => {
  setActing(courseId);
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("student_id", profile.id)
    .eq("course_id", courseId);

  if (error) {
    alert("Failed to drop course: " + error.message);
  }
  await onRefresh();
  setActing(null);
};

  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10">
        <Loader2 size={16} className="animate-spin" /> Loading courses...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Enrolled summary */}
      {enrollments.length > 0 && (
        <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Enrolled Courses
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {enrollments.length} courses registered for this semester
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {enrollments.map((e: any) => {
              const c = e.course;
              if (!c) return null;
              const slots = c.classes || [];
              return (
                <div
                  key={e.id}
                  className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 rounded-full px-2 py-0.5">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {c.title}
                      </p>
                      {c.lecturer ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0">
                            {c.lecturer.avatar_url ? (
                              <Image
                                src={c.lecturer.avatar_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
                                {c.lecturer.full_name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {c.lecturer.full_name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No lecturer assigned</p>
                      )}
                      {slots.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {slots.map((sl: any) => (
                            <p
                              key={sl.id}
                              className="text-xs font-mono text-gray-400"
                            >
                              {sl.day} · {sl.start_time}–{sl.end_time}{" "}
                              {sl.location?.name ? `· ${sl.location.name}` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => drop(c.id)}
                      disabled={acting === c.id}
                      className="shrink-0 text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-500/30 rounded-lg px-2.5 py-1 transition disabled:opacity-50"
                    >
                      {acting === c.id ? <Loader2 size={12} className="animate-spin" /> : "Drop"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse all level courses */}
      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          All {profile?.level} Level Courses
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Click Enroll to add a course to your list
        </p>
        {allCourses.length === 0 ? (
          <p className="text-sm text-gray-400">No courses available for your level yet.</p>
        ) : (
          <ul className="space-y-3">
            {allCourses.map((c: any) => {
              const isEnrolled = enrolledIds.has(c.id);
              return (
                <li
                  key={c.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                    isEnrolled
                      ? "border-brand-green/20 bg-brand-green/5"
                      : "border-gray-100 dark:border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 rounded-full px-2 py-0.5">
                        {c.code}
                      </span>
                      <span className="text-xs font-mono text-gray-400">Sem {c.semester}</span>
                      {isEnrolled && <CheckCheck size={13} className="text-brand-green" />}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.lecturer?.full_name || "Unassigned"}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <button
                      onClick={() => drop(c.id)}
                      disabled={acting === c.id}
                      className="text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-500/30 rounded-full px-4 py-2 transition disabled:opacity-50"
                    >
                      {acting === c.id ? <Loader2 size={11} className="animate-spin" /> : "Drop"}
                    </button>
                  ) : (
                    <button
                      onClick={() => enroll(c.id)}
                      disabled={acting === c.id}
                      className="flex items-center gap-1.5 bg-brand-green text-white rounded-full px-4 py-2 text-xs font-medium hover:bg-brand-green-dark transition disabled:opacity-50 shadow-glow"
                    >
                      {acting === c.id ? <Loader2 size={11} className="animate-spin" /> : "Enroll"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Assignments View ─── */
function AssignmentsView({ assignments, loading, profile }: any) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const handleUpload = async (assignmentId: string, file: File) => {
    setSubmitting(assignmentId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${assignmentId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("submissions")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: "submitted",
        });

      if (insertError) throw insertError;

      setSubmittedIds((prev) => new Set([...prev, assignmentId]));
    } catch (err: any) {
      console.error("Assignment upload error:", err);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-10 sm:p-16 flex flex-col items-center text-center">
        <ClipboardList
          size={32}
          className="text-gray-200 dark:text-gray-700 mb-4"
          strokeWidth={1.5}
        />
        <p className="text-gray-400">No assignments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((a: any) => {
        const overdue = a.deadline && new Date(a.deadline) < new Date();
        const submitted = submittedIds.has(a.id);
        return (
          <div
            key={a.id}
            className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-mono text-brand-green font-medium">
                  {a.courses?.code}
                </p>
                <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">
                  {a.title}
                </p>
                {a.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    {a.description}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-mono px-2.5 py-1 rounded-full font-medium border ${
                  overdue
                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900"
                    : "bg-brand-green/10 text-brand-green border-brand-green/20"
                }`}
              >
                {a.deadline
                  ? `${overdue ? "Closed" : "Due"} ${new Date(
                      a.deadline,
                    ).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}`
                  : "No deadline"}
              </span>
            </div>

            {!overdue &&
              (submitted ? (
                <div className="flex items-center gap-2 text-brand-green text-sm">
                  <CheckCircle2 size={15} /> Submitted
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip"
                    className="hidden"
                    disabled={submitting === a.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(a.id, file);
                    }}
                  />
                  <span className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-4 py-2 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-soft dark:shadow-soft-dark">
                    {submitting === a.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    {submitting === a.id
                      ? "Uploading..."
                      : "Submit PDF / DOCX / ZIP"}
                  </span>
                </label>
              ))}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Attendance View ─── */
function AttendanceView({ classes, loading }: any) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-10 sm:p-16 flex flex-col items-center text-center">
        <CalendarCheck
          size={32}
          className="text-gray-200 dark:text-gray-700 mb-4"
          strokeWidth={1.5}
        />
        <p className="text-gray-400">No classes to check into yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((c: any) => (
        <div
          key={c.id}
          className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                <span className="font-mono text-xs text-brand-green">
                  {c.courses?.code}
                </span>{" "}
                — {c.courses?.title}
              </p>
              {c.locations?.name && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={11} /> {c.locations.name},{" "}
                  {c.locations.building}
                </p>
              )}
              <p className="text-xs font-mono text-gray-400 mt-0.5">
                {c.day} · {c.start_time}–{c.end_time}
              </p>
            </div>
          </div>
          <AttendanceCheckIn classId={c.id} />
        </div>
      ))}
    </div>
  );
}

/* ─── Complaint Form ─── */
function ComplaintForm({ profile }: any) {
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
    if (!profile?.id) return;
    const load = async () => {
      setLoadingMine(true);
      const [{ data: lecs }, { data: crs }, { data: myComplaints }] =
        await Promise.all([
          supabase.from("users").select("id, full_name").eq("role", "lecturer"),
          supabase
            .from("courses")
            .select("id, code, title")
            .eq("level", profile.level),
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
  }, [profile?.id, profile?.level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    <div className="grid md:grid-cols-2 gap-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Submit a complaint
          </h2>
          <p className="text-sm text-gray-400">
            Send an official message to a lecturer
          </p>
        </div>

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
              onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
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
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
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
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
            placeholder="Describe your concern..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
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

      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          My complaints
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Recent submissions and their status
        </p>
        {loadingMine ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
        ) : mine.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageCircle
              size={28}
              className="text-gray-200 dark:text-gray-700 mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm text-gray-400">Nothing submitted yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {mine.map((c: any) => (
              <li
                key={c.id}
                className="border border-gray-100 dark:border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {c.subject}
                  </p>
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full font-medium ${
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
  );
}

/* ─── News View ─── */
function NewsView() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setNews(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark overflow-hidden animate-pulse"
          >
            <div className="aspect-[16/10] bg-gray-100 dark:bg-white/5" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-white/10 rounded-full" />
              <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full" />
              <div className="h-3 w-2/3 bg-gray-100 dark:bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-10 sm:p-16 flex flex-col items-center text-center">
        <Newspaper
          size={32}
          className="text-gray-200 dark:text-gray-700 mb-4"
          strokeWidth={1.5}
        />
        <p className="text-gray-400">No news yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {news.map((n: any) => (
        <article
          key={n.id}
          className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark overflow-hidden flex flex-col hover:shadow-lifted dark:hover:shadow-lifted-dark transition-shadow"
        >
          <div className="aspect-[16/10] bg-gray-100 dark:bg-white/5 shrink-0 overflow-hidden">
            {n.image_url ? (
              <Image
                src={n.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center dot-grid">
                <Newspaper
                  size={26}
                  className="text-gray-300 dark:text-gray-600"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-medium text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-2 py-0.5">
                {n.type}
              </span>
              <span className="text-xs font-mono text-gray-400">
                {new Date(n.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <h3 className="text-base font-medium leading-snug line-clamp-2 min-h-[2.75rem] text-gray-900 dark:text-white">
              {n.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3">
              {n.body}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ─── Avatar Upload Modal ─── */
function AvatarUploadModal({ session, refreshProfile, signOut }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark p-6 sm:p-8 overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mb-5 relative shadow-glow">
          <Camera className="text-brand-green" size={22} />
        </div>

        <h2 className="relative text-xl font-medium text-center mb-2 text-gray-900 dark:text-white">
          Upload Profile Picture
        </h2>
        <p className="relative text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
          To finalize your account setup, please upload a clear, high-quality
          portrait of yourself. This is required for course rosters and exams.
        </p>

        {error && (
          <div className="relative w-full flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-200 dark:border-white/15 rounded-3xl overflow-hidden group flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 hover:border-brand-green transition cursor-pointer mb-6">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center p-4">
              <User
                size={36}
                className="text-gray-300 dark:text-gray-600 group-hover:text-brand-green transition mb-2"
                strokeWidth={1.5}
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-500 transition text-center font-medium">
                Select photo
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="relative w-full space-y-3">
          <button
            onClick={onUpload}
            disabled={!file || uploading}
            className="w-full bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-soft dark:shadow-soft-dark"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} />
                Set profile picture
              </>
            )}
          </button>

          <button
            onClick={() => signOut()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition py-2 font-medium"
          >
            <LogOut size={14} />
            Sign out of portal
          </button>
        </div>
      </div>
    </div>
  );
}
