"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AcademicCalendar {
  semester: number;
  session: string;
}

export function useAcademicCalendar() {
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "academic_calendar")
        .single();
      if (data?.value) {
        setCalendar({
          semester: data.value.semester ?? 1,
          session: data.value.session ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  return { calendar, loading };
}