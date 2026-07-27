"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Clock, AlertCircle } from "lucide-react";

interface Props {
  sessionId: string;
}

type AttendanceRecord = {
  id: string;
  marked_at: string;
  status: string;
  student: {
    full_name: string;
    matric_number: string;
    avatar_url: string | null;
  };
};

export default function SessionAttendanceList({ sessionId }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);

      // Fetch records and join with the users table to get student details
      const { data, error: fetchError } = await supabase
        .from("attendance_records")
        .select(
          `
          id,
          marked_at,
          status,
          student:users (
            full_name,
            matric_number,
            avatar_url
          )
        `,
        )
        .eq("session_id", sessionId)
        .order("marked_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load attendance records.");
        console.error(fetchError);
      } else {
        // @ts-ignore - Supabase types for joined tables can be tricky, safely casting here
        setRecords(data as AttendanceRecord[]);
      }

      setLoading(false);
    }

    if (sessionId) {
      fetchAttendance();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users size={18} />
          Checked-in Students
        </h3>
        <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-sm font-medium">
          {records.length} Present
        </span>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No students have checked in yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {records.map((record) => (
            <li
              key={record.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {record.student.avatar_url ? (
                    <img
                      src={record.student.avatar_url}
                      alt={record.student.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">
                      {record.student.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {record.student.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.student.matric_number || "No Matric Number"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={14} />
                {new Date(record.marked_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
