// src/components/dashboard/SubmissionsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Submission {
  id: string;
  file_url: string;
  file_name: string;
  grade: number | null;
  feedback: string | null;
  student: { full_name: string; matric_number: string | null } | null;
}

export default function SubmissionsPanel({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { grade: string; feedback: string }>
  >({});
  const [error, setError] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("assignment_submissions")
      .select("*, student:users!student_id(full_name, matric_number)")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setSubmissions(data || []);
    const initialDrafts: Record<string, { grade: string; feedback: string }> =
      {};
    (data || []).forEach((s: Submission) => {
      initialDrafts[s.id] = {
        grade: s.grade?.toString() ?? "",
        feedback: s.feedback ?? "",
      };
    });
    setDrafts(initialDrafts);
    setLoading(false);
  };

  const saveGrade = async (submissionId: string) => {
    setError("");
    setSavingId(submissionId);

    const draft = drafts[submissionId];
    const gradeNum = draft.grade === "" ? null : Number(draft.grade);

    if (gradeNum !== null && (gradeNum < 0 || gradeNum > 100)) {
      setError("Grade must be between 0 and 100.");
      setSavingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("assignment_submissions")
      .update({
        grade: gradeNum,
        feedback: draft.feedback || null,
        status: "graded",
      })
      .eq("id", submissionId);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    await loadSubmissions();
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-10">
        <Loader2 size={16} className="animate-spin" /> Loading submissions...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 p-10 text-center">
        <p className="text-gray-400 text-sm">No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submissions.map((s) => (
        <div key={s.id} className="rounded-3xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium">
                {s.student?.full_name ?? "Unknown student"}
              </p>
              <p className="text-xs text-gray-400">
                {s.student?.matric_number ?? "—"}
              </p>
            </div>
            <a
              href={s.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-black transition"
            >
              <Download size={13} /> {s.file_name}
            </a>
          </div>

          <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Grade"
              value={drafts[s.id]?.grade ?? ""}
              onChange={(e) =>
                setDrafts({
                  ...drafts,
                  [s.id]: { ...drafts[s.id], grade: e.target.value },
                })
              }
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <input
              placeholder="Feedback (optional)"
              value={drafts[s.id]?.feedback ?? ""}
              onChange={(e) =>
                setDrafts({
                  ...drafts,
                  [s.id]: { ...drafts[s.id], feedback: e.target.value },
                })
              }
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => saveGrade(s.id)}
            disabled={savingId === s.id}
            className="mt-3 bg-[#0a0a0a] text-white rounded-full px-5 py-2 text-xs font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {savingId === s.id ? "Saving..." : "Save grade"}
          </button>
        </div>
      ))}
    </div>
  );
}
