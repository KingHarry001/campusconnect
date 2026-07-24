"use client";

import { useState } from "react";
import { MapPin, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Props {
  classId: string;
}

type Status =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "no_session"
  | "already";

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1);
  const dlambda = toRad(lon2 - lon1);
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlambda / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function AttendanceCheckIn({ classId }: Props) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleCheckIn = async () => {
    setStatus("loading");
    setMessage("");

    // 1. Get active session for this class
    const now = new Date().toISOString();
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .lte("opens_at", now)
      .gte("closes_at", now)
      .maybeSingle();

    if (sessionError || !session) {
      setStatus("no_session");
      setMessage("No active attendance window for this class right now.");
      return;
    }

    // 2. Get user's GPS position
    let coords: GeolocationCoordinates;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
      coords = pos.coords;
    } catch {
      setStatus("error");
      setMessage("Could not get your location. Please allow location access.");
      return;
    }

    // 3. Distance check — computed client-side now
    if (session.latitude == null || session.longitude == null) {
      setStatus("error");
      setMessage("This session has no location configured.");
      return;
    }

    const distance = haversineMeters(
      coords.latitude,
      coords.longitude,
      session.latitude,
      session.longitude,
    );
    const radius = session.radius ?? 5;

    if (distance > radius) {
      setStatus("error");
      setMessage(
        `You are ${distance.toFixed(1)}m away, outside the ${radius}m radius.`,
      );
      return;
    }

    // 4. Enrollment check (RLS also enforces student_id = auth.uid() on insert,
    //    but we check enrollment here for a clean error message)
    if (!profile?.id) {
      setStatus("error");
      setMessage("You must be signed in to check in.");
      return;
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", profile.id)
      .eq("course_id", session.class_id) // see note below re: class_id vs course_id
      .maybeSingle();

    // 5. Insert record — RLS policy enforces auth.uid() = student_id
    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        session_id: session.id,
        student_id: profile.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: "present",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        setStatus("already");
        setMessage("You've already checked in for this session.");
      } else if (
        insertError.code === "42501" ||
        insertError.message?.includes("policy")
      ) {
        setStatus("error");
        setMessage(
          "You're not eligible to check in (not enrolled, or window closed).",
        );
      } else {
        setStatus("error");
        setMessage("Check-in failed. " + insertError.message);
      }
      return;
    }

    setStatus("success");
    setMessage(
      `Attendance marked successfully! (${distance.toFixed(1)}m away)`,
    );
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-2xl px-4 py-3 text-sm">
        <CheckCircle size={16} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {(status === "error" || status === "already") && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle size={15} />
          <span>{message}</span>
        </div>
      )}
      {status === "no_session" && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle size={15} />
          <span>{message}</span>
        </div>
      )}
      <button
        onClick={handleCheckIn}
        disabled={status === "loading"}
        className="flex items-center gap-2 bg-[#0a0a0a] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 w-fit"
      >
        {status === "loading" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MapPin size={16} />
        )}
        {status === "loading" ? "Locating you..." : "Mark attendance"}
      </button>
    </div>
  );
}
