"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid, Users, BookOpen, MapPin, Megaphone, BarChart3,
  Loader2, CheckCircle2, XCircle, Plus, Trash2, X, Eye,
  CalendarClock, Settings, Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GridBackground from "@/components/ui/GridBackground";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "users", label: "Manage Users", icon: Users },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "classes", label: "Classes", icon: CalendarClock },
];

const MORE_TABS = [
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Academic Settings", icon: Settings },
];

/* ─── Shared skeleton block ─── */
function SkeletonRow() {
  return (
    <div className="rounded-2xl glass-panel shadow-soft dark:shadow-soft-dark p-4 animate-pulse flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 bg-gray-200 dark:bg-white/10 rounded-full" />
        <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-white/5 rounded-full" />
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const { profile } = useAuth();
  const [active, setActive] = useState("overview");

  return (
    <DashboardLayout
      tabs={TABS}
      secondaryTabs={MORE_TABS}
      active={active}
      setActive={setActive}
      title="Admin Dashboard"
      portalLabel="Control Centre"
    >
      {active === "overview" && <AdminOverview />}
      {active === "users" && <UsersManager />}
      {active === "courses" && <CoursesManager />}
      {active === "classes" && <ClassesManager />}
      {active === "locations" && <LocationsManager />}
      {active === "announcements" && <AnnouncementsManager profile={profile} />}
      {active === "analytics" && <Analytics />}
      {active === "settings" && <AcademicSettings />}
    </DashboardLayout>
  );
}

/* ─── Admin Overview ─── */
function AdminOverview() {
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    courses: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ count: s }, { count: l }, { count: c }, { count: p }] =
        await Promise.all([
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "student"),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "lecturer"),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending_approval"),
        ]);
      setStats({
        students: s || 0,
        lecturers: l || 0,
        courses: c || 0,
        pending: p || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
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
          Admin{" "}
          <span className="font-voice italic font-normal text-green-400">
            Command Centre
          </span>
        </h2>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[76px] animate-pulse"
                >
                  <div className="h-3 w-16 bg-white/10 rounded-full mb-2" />
                  <div className="h-5 w-8 bg-white/10 rounded-full" />
                </div>
              ))
            : [
                { label: "Students", value: String(stats.students) },
                { label: "Lecturers", value: String(stats.lecturers) },
                { label: "Courses", value: String(stats.courses) },
                {
                  label: "Pending approval",
                  value: String(stats.pending),
                  alert: stats.pending > 0,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`backdrop-blur-sm border rounded-2xl p-4 min-h-[76px] flex flex-col justify-between ${
                    (s as any).alert
                      ? "bg-amber-400/10 border-amber-400/20 shadow-glow"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <p className="text-xs text-white/40 mb-1 leading-snug">
                    {s.label}
                  </p>
                  <p
                    className={`text-xl font-mono font-medium ${
                      (s as any).alert ? "text-amber-400" : "text-green-400"
                    }`}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
        </div>
      </div>

      {!loading && stats.pending > 0 && (
        <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-6">
          <h3 className="font-medium text-amber-900 dark:text-amber-300 mb-1">
            {stats.pending} lecturer{stats.pending !== 1 ? "s" : ""} awaiting
            approval
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/90">
            Visit the <strong>Manage Users</strong> tab to review and approve or
            reject pending lecturer accounts.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Users Manager ─── */
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending_approval" | "student" | "lecturer"
  >("all");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending_approval") q = q.eq("status", "pending_approval");
    else if (filter === "student") q = q.eq("role", "student");
    else if (filter === "lecturer") q = q.eq("role", "lecturer");
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const approve = async (userId: string) => {
    setActing(userId);
    await supabase.from("users").update({ status: "active" }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u)),
    );
    setActing(null);
  };

  const ban = async (userId: string, currentStatus: string) => {
    setActing(userId);
    const newStatus = currentStatus === "banned" ? "active" : "banned";
    await supabase.from("users").update({ status: newStatus }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
    );
    setActing(null);
  };

  const setLevel = async (userId: string, level: string) => {
    setActing(userId);
    await supabase.from("users").update({ level }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, level } : u)),
    );
    setActing(null);
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex glass-panel rounded-2xl p-1 gap-1 w-fit shadow-soft dark:shadow-soft-dark">
        {(["all", "pending_approval", "student", "lecturer"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === f
                  ? "bg-brand-green/10 text-brand-green shadow-glow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {f === "pending_approval"
                ? "Pending"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u: any) => (
            <div
              key={u.id}
              className="rounded-2xl glass-panel shadow-soft dark:shadow-soft-dark p-4"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/10 ring-2 ring-brand-green/15 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 overflow-hidden shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      u.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "?"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {u.full_name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {u.email} · <span className="capitalize">{u.role}</span>
                      {u.level ? ` · ${u.level} Level` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      u.status === "active"
                        ? "bg-brand-green/10 text-brand-green"
                        : u.status === "banned"
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {u.status.replace("_", " ")}
                  </span>
                  {u.role === "student" && (
                    <select
                      value={u.level || ""}
                      onChange={(e) => setLevel(u.id, e.target.value)}
                      disabled={acting === u.id}
                      className="text-xs border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-green/50 disabled:opacity-50"
                    >
                      <option value="">Set level</option>
                      {["100", "200", "300", "400", "500"].map((l) => (
                        <option key={l} value={l}>
                          {l} Level
                        </option>
                      ))}
                    </select>
                  )}
                  {u.status === "pending_approval" && (
                    <button
                      onClick={() => approve(u.id)}
                      disabled={acting === u.id}
                      className="flex items-center gap-1 bg-brand-green text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-brand-green-dark transition disabled:opacity-50 shadow-glow"
                    >
                      {acting === u.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      Approve
                    </button>
                  )}
                  {u.role !== "admin" && (
                    <button
                      onClick={() => ban(u.id, u.status)}
                      disabled={acting === u.id}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                        u.status === "banned"
                          ? "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15"
                          : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60"
                      }`}
                    >
                      {u.status === "banned" ? "Unban" : "Ban"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-3 py-1.5 text-xs font-medium transition"
                  >
                    <Eye size={12} />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">
              No users found in this category.
            </p>
          )}
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

/* ─── User Detail Modal Component ─── */
function UserDetailModal({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl shadow-lifted dark:shadow-lifted-dark overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 dot-grid">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            User Profile Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="trace-divider" />

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Avatar and Primary Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-start text-center sm:text-left pb-6 border-b border-gray-100 dark:border-white/10">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-white/10 ring-4 ring-brand-green/15 shadow-glow flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                user.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"
              )}
            </div>
            <div>
              <h4 className="text-xl font-medium text-gray-900 dark:text-white">
                {user.full_name || "—"}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <span className="text-xs font-mono px-2.5 py-1 rounded-full font-medium capitalize bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                  {user.role}
                </span>
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-full font-medium capitalize ${
                    user.status === "active"
                      ? "bg-brand-green/10 text-brand-green"
                      : user.status === "banned"
                      ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {user.status?.replace("_", " ") || "—"}
                </span>
                {user.level && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full font-medium bg-brand-green/10 text-brand-green">
                    {user.level} Level
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                Department
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.department || "Computer Engineering"}
              </p>
            </div>
            <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                Phone Number
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.phone || "—"}
              </p>
            </div>

            {user.role === "student" ? (
              <>
                <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                    Matric Number
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.matric_number || "—"}
                  </p>
                </div>
                <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                    Academic Adviser
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.academic_adviser || "—"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                    Staff ID
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.staff_id || "—"}
                  </p>
                </div>
                <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                    Office Location
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.office || "—"}
                  </p>
                </div>
              </>
            )}

            <div className="bg-gray-50/70 dark:bg-white/5 rounded-2xl p-4 border border-gray-100/70 dark:border-white/5 col-span-2">
              <p className="text-xs text-gray-400 font-mono font-medium mb-1">
                Date Joined
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="trace-divider" />
        <div className="flex justify-end px-6 py-4">
          <button
            onClick={onClose}
            className="bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full px-5 py-2.5 text-sm font-medium transition shadow-soft dark:shadow-soft-dark"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Courses Manager ─── */
function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: "",
    title: "",
    level: "100",
    semester: "1",
    lecturerId: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: c }, { data: l }] = await Promise.all([
        supabase.from("courses").select("*, users(full_name)").order("code"),
        supabase
          .from("users")
          .select("id, full_name")
          .eq("role", "lecturer")
          .eq("status", "active"),
      ]);
      setCourses(c || []);
      setLecturers(l || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.title) return;
    setSaving(true);
    const { data } = await supabase
      .from("courses")
      .insert({
        code: form.code.toUpperCase(),
        title: form.title,
        level: form.level,
        semester: parseInt(form.semester),
        lecturer_id: form.lecturerId || null,
      })
      .select("*, users(full_name)")
      .single();
    if (data) setCourses([data, ...courses]);
    setForm({
      code: "",
      title: "",
      level: "100",
      semester: "1",
      lecturerId: "",
    });
    setSaving(false);
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form
        onSubmit={handleCreate}
        className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Add course
          </h2>
          <p className="text-sm text-gray-400">
            Register a new course in the department
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Course code
            </label>
            <input
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30 uppercase"
              placeholder="CPE 301"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Level
            </label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              {["100", "200", "300", "400", "500"].map((l) => (
                <option key={l} value={l}>
                  {l} Level
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Title
          </label>
          <input
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="e.g. Digital Electronics"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Semester
            </label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Lecturer (optional)
            </label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.lecturerId}
              onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !form.code || !form.title}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          {saving ? "Adding..." : "Add course"}
        </button>
      </form>

      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Registered courses
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {courses.length} courses total
        </p>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {courses.map((c: any) => (
              <li
                key={c.id}
                className="flex items-center justify-between border border-gray-100 dark:border-white/10 rounded-2xl p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-2 py-0.5">
                      {c.code}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {c.level} Level · Sem {c.semester}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 text-gray-900 dark:text-white">
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {c.users?.full_name || "No lecturer assigned"}
                  </p>
                </div>
                <button
                  onClick={() => deleteCourse(c.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition p-1"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Locations Manager ─── */
function LocationsManager() {
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    building: "",
    latitude: "",
    longitude: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("building");
      setLocations(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude) return;
    setSaving(true);
    const { data } = await supabase
      .from("locations")
      .insert({
        name: form.name,
        building: form.building || null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      })
      .select()
      .single();
    if (data) setLocations([data, ...locations]);
    setForm({ name: "", building: "", latitude: "", longitude: "" });
    setSaving(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form
        onSubmit={handleCreate}
        className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Add location
          </h2>
          <p className="text-sm text-gray-400">
            Register a classroom or lab with GPS coordinates
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Room name
          </label>
          <input
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="e.g. LT 1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Building
          </label>
          <input
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="e.g. Engineering Block A"
            value={form.building}
            onChange={(e) => setForm({ ...form, building: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="6.8924"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              placeholder="3.7172"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !form.name || !form.latitude || !form.longitude}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <MapPin size={14} />
          )}
          {saving ? "Saving..." : "Save location"}
        </button>
      </form>

      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Campus locations
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {locations.length} registered venues
        </p>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {locations.map((loc: any) => (
              <li
                key={loc.id}
                className="border border-gray-100 dark:border-white/10 rounded-2xl p-3"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {loc.name}
                </p>
                <p className="text-xs text-gray-400">{loc.building}</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 font-mono">
                  {loc.latitude}, {loc.longitude}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Announcements Manager (same as lecturer's) ─── */
function AnnouncementsManager({ profile }: any) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "announcement",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnnouncements(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("announcements")
      .insert({ ...form, created_by: profile?.id })
      .select()
      .single();
    if (data) setAnnouncements([data, ...announcements]);
    setForm({ title: "", body: "", type: "announcement" });
    setSaving(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form
        onSubmit={handlePost}
        className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Post department announcement
          </h2>
          <p className="text-sm text-gray-400">
            Broadcast to all students and staff
          </p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Title
          </label>
          <input
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="Announcement title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Body
          </label>
          <textarea
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="Message content..."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">
            Type
          </label>
          <select
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="announcement">Announcement</option>
            <option value="news">News</option>
            <option value="alert">Alert</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Megaphone size={14} />
          )}
          {saving ? "Posting..." : "Post"}
        </button>
      </form>

      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Recent posts
        </h2>
        <p className="text-sm text-gray-400 mb-6">Last 20 announcements</p>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-3 max-h-[400px] overflow-y-auto">
            {announcements.map((a: any) => (
              <li
                key={a.id}
                className="border border-gray-100 dark:border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.title}
                  </p>
                  <span className="text-xs font-mono text-gray-400 shrink-0 ml-3">
                    {new Date(a.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {a.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Analytics ─── */
function Analytics() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: totalStudents },
        { count: totalLecturers },
        { count: totalCourses },
        { count: totalAssignments },
        { count: openComplaints },
        { count: resolvedComplaints },
        { count: attendanceSessions },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "lecturer"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase
          .from("assignments")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
        supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved"),
        supabase
          .from("attendance_sessions")
          .select("*", { count: "exact", head: true }),
      ]);
      setStats({
        totalStudents,
        totalLecturers,
        totalCourses,
        totalAssignments,
        openComplaints,
        resolvedComplaints,
        attendanceSessions,
      });
      setLoading(false);
    };
    load();
  }, []);

  const items = [
    { label: "Total students", value: stats.totalStudents },
    { label: "Total lecturers", value: stats.totalLecturers },
    { label: "Courses registered", value: stats.totalCourses },
    { label: "Assignments published", value: stats.totalAssignments },
    { label: "Open complaints", value: stats.openComplaints },
    { label: "Resolved complaints", value: stats.resolvedComplaints },
    { label: "Attendance sessions", value: stats.attendanceSessions },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 text-center animate-pulse"
          >
            <div className="h-7 w-12 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-2" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-white/5 rounded-full mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 text-center hover:shadow-lifted dark:hover:shadow-lifted-dark transition-shadow"
        >
          <p className="text-3xl font-mono font-medium text-gray-900 dark:text-white mb-1">
            {item.value ?? "—"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Classes Manager (weekly schedule slots) ─── */
function ClassesManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({ courseId: "", day: "Monday", startTime: "", endTime: "", locationId: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ courseId: "", day: "", startTime: "", endTime: "", locationId: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const load = async () => {
    setLoading(true);
    const [{ data: cls }, { data: crs }, { data: locs }] = await Promise.all([
      supabase
        .from("classes")
        .select("*, courses(code, title, level), locations(name, building)")
        .order("day"),
      supabase.from("courses").select("id, code, title, level").order("code"),
      supabase.from("locations").select("id, name, building").order("name"),
    ]);
    setClasses(cls || []);
    setCourses(crs || []);
    setLocations(locs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.courseId || !form.day || !form.startTime || !form.endTime) {
      setError("Course, day, start and end time are all required.");
      return;
    }
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("classes")
      .insert({
        course_id: form.courseId,
        day: form.day,
        start_time: form.startTime,
        end_time: form.endTime,
        location_id: form.locationId || null,
      })
      .select("*, courses(code, title, level), locations(name, building)")
      .single();
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) setClasses([data, ...classes]);
    setForm({ courseId: "", day: "Monday", startTime: "", endTime: "", locationId: "" });
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditForm({
      courseId: c.course_id,
      day: c.day,
      startTime: c.start_time,
      endTime: c.end_time,
      locationId: c.location_id || "",
    });
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(true);
    const { data, error: updateError } = await supabase
      .from("classes")
      .update({
        course_id: editForm.courseId,
        day: editForm.day,
        start_time: editForm.startTime,
        end_time: editForm.endTime,
        location_id: editForm.locationId || null,
      })
      .eq("id", id)
      .select("*, courses(code, title, level), locations(name, building)")
      .single();
    setSavingEdit(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setClasses((prev) => prev.map((c) => (c.id === id ? data : c)));
    setEditingId(null);
  };

  const deleteClass = async (id: string) => {
    await supabase.from("classes").delete().eq("id", id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleCreate} className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Schedule a class</h2>
          <p className="text-sm text-gray-400">Set a weekly time slot for a course</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3">{error}</p>
        )}

        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Course</label>
          <select
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} · {c.level} Level — {c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Day</label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value })}
            >
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Location</label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            >
              <option value="">No location set</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Start time</label>
            <input
              type="time"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">End time</label>
            <input
              type="time"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {saving ? "Scheduling..." : "Add class"}
        </button>
      </form>

      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Scheduled classes</h2>
        <p className="text-sm text-gray-400 mb-6">{classes.length} weekly slots</p>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <p className="text-sm text-gray-400">No classes scheduled yet.</p>
        ) : (
          <ul className="space-y-3 max-h-[500px] overflow-y-auto">
            {classes.map((c: any) => (
              <li key={c.id} className="border border-gray-100 dark:border-white/10 rounded-2xl p-4">
                {editingId === c.id ? (
                  <div className="space-y-3">
                    <select
                      className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-3 py-2 text-xs"
                      value={editForm.courseId}
                      onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                    >
                      {courses.map((crs) => (
                        <option key={crs.id} value={crs.id}>{crs.code} · {crs.level} Level</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-3 py-2 text-xs"
                        value={editForm.day}
                        onChange={(e) => setEditForm({ ...editForm, day: e.target.value })}
                      >
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select
                        className="border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-3 py-2 text-xs"
                        value={editForm.locationId}
                        onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })}
                      >
                        <option value="">No location</option>
                        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        className="border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-3 py-2 text-xs"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      />
                      <input
                        type="time"
                        className="border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg px-3 py-2 text-xs"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(c.id)}
                        disabled={savingEdit}
                        className="flex-1 flex items-center justify-center gap-1 bg-brand-green text-white rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 shadow-glow"
                      >
                        {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-2 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-medium text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-2 py-0.5">
                        {c.courses?.code}
                      </span>
                      <p className="text-sm mt-2 text-gray-900 dark:text-white font-mono">
                        {c.day} · {c.start_time}–{c.end_time}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.locations?.name ? `${c.locations.name}, ${c.locations.building || ""}` : "No location set"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-brand-green transition p-1.5 text-xs font-medium">
                        Edit
                      </button>
                      <button onClick={() => deleteClass(c.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition p-1.5">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Academic Settings (current semester + session) ─── */
function AcademicSettings() {
  const [form, setForm] = useState({ semester: "1", session: "", examStartDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "academic_calendar")
        .single();
      if (data?.value) {
        setForm({
          semester: String(data.value.semester ?? "1"),
          session: data.value.session ?? "",
          examStartDate: data.value.exam_start_date ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!form.session.trim()) {
      setError("Session (e.g. 2025/2026) is required.");
      return;
    }
    setSaving(true);
    const { error: upsertError } = await supabase
      .from("system_settings")
      .update({
        value: {
          semester: parseInt(form.semester),
          session: form.session,
          exam_start_date: form.examStartDate || null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "academic_calendar");
    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-8 animate-pulse max-w-lg">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded-full mb-4" />
        <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSave} className="rounded-3xl glass-panel shadow-soft dark:shadow-soft-dark p-6 sm:p-8 space-y-5">
        <div className="relative dot-grid -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 py-6 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shadow-glow">
              <CalendarClock size={18} className="text-brand-green" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Academic calendar</h2>
              <p className="text-xs font-mono text-gray-400">Sets the current semester across the portal</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3">{error}</p>
        )}
        {saved && (
          <p className="flex items-center gap-2 text-sm text-brand-green bg-brand-green/10 rounded-xl px-4 py-3">
            <CheckCircle2 size={15} /> Saved
          </p>
        )}

        <div>
          <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Session</label>
          <input
            className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            placeholder="2025/2026"
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Current semester</label>
            <select
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2 text-gray-900 dark:text-gray-200">Exam start date</label>
            <input
              type="date"
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              value={form.examStartDate}
              onChange={(e) => setForm({ ...form, examStartDate: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 shadow-soft dark:shadow-soft-dark"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save calendar"}
        </button>
      </form>
    </div>
  );
}