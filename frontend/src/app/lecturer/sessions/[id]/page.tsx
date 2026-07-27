"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import SessionAttendanceList from "@/components/SessionAttendanceList"; // Adjust this import path to where you saved the component

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      // Fetch the session and join the class & course details
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(
          `
          *,
          classes (
            day,
            start_time,
            end_time,
            venue,
            courses (
              code,
              title
            )
          )
        `,
        )
        .eq("id", sessionId)
        .single();

      if (!error && data) {
        setSession(data);
      }
      setLoading(false);
    }

    if (sessionId) fetchSession();
  }, [sessionId]);

  if (loading) {
    return <div className="p-8 text-center">Loading session details...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 text-center text-red-600">Session not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Session Header Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.classes.courses.code}: {session.classes.courses.title}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar size={16} />
              {new Date(session.opens_at).toLocaleDateString()} |{" "}
              {session.classes.start_time} - {session.classes.end_time}
            </p>
          </div>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            {new Date(session.closes_at) > new Date() ? "Active" : "Closed"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>Venue: {session.classes.venue || "Not specified"}</span>
        </div>
      </div>

      {/* The Attendance List Component We Just Made */}
      <SessionAttendanceList sessionId={sessionId} />
    </div>
  );
}
