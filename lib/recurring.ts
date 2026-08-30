import { supabase } from "./supabase";
import { requireTeacherId } from "./current-teacher";
import { zonedDateTimeToUtc } from "./timezone";

function db() { if (!supabase) throw new Error("Supabase is not configured"); return supabase; }

type RecurringInput = { student_id?: string | null; title: string; weekday: number; start_time: string; duration_minutes: number; timezone: string; starts_on: string; notes?: string | null };

export async function createRecurringSchedule(input: RecurringInput) {
  const teacher_id = await requireTeacherId();
  return db().from("recurring_schedules").insert({ ...input, teacher_id, status: "active" }).select().single();
}

export async function updateRecurringSchedule(id: string, input: Partial<RecurringInput> & { status?: string; ends_on?: string | null }) {
  const teacher_id = await requireTeacherId();
  return db().from("recurring_schedules").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function cancelRecurringSchedule(id: string) {
  return updateRecurringSchedule(id, { status: "cancelled" });
}

export async function syncRecurringSchedules(days = 90) {
  const teacher_id = await requireTeacherId();
  const database = db();
  const { data: schedules, error } = await database.from("recurring_schedules").select("*").eq("teacher_id", teacher_id).eq("status", "active");
  if (error) return { data: null, error };
  if (!schedules?.length) return { data: [], error: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);
  const fromIso = new Date(today.getTime() - 86400000).toISOString();
  const toIso = new Date(horizon.getTime() + 86400000).toISOString();
  const { data: existing, error: existingError } = await database.from("events").select("id,recurring_schedule_id,starts_at").eq("teacher_id", teacher_id).not("recurring_schedule_id", "is", null).gte("starts_at", fromIso).lt("starts_at", toIso);
  if (existingError) return { data: null, error: existingError };
  const existingKeys = new Set((existing || []).map((e: any) => `${e.recurring_schedule_id}|${e.starts_at}`));
  const inserts: any[] = [];
  for (const schedule of schedules as any[]) {
    const startDate = new Date(Math.max(today.getTime(), new Date(`${schedule.starts_on}T00:00:00`).getTime()));
    for (let cursor = new Date(startDate); cursor < horizon; cursor.setDate(cursor.getDate() + 1)) {
      const weekday = cursor.getDay();
      if (weekday !== Number(schedule.weekday)) continue;
      const localDate = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      const start = zonedDateTimeToUtc(localDate, String(schedule.start_time).slice(0, 5), schedule.timezone);
      const end = new Date(start.getTime() + Number(schedule.duration_minutes || 60) * 60000);
      const startsAt = start.toISOString();
      if (!existingKeys.has(`${schedule.id}|${startsAt}`)) {
        inserts.push({ teacher_id, student_id: schedule.student_id, event_type: schedule.student_id ? "lesson" : "personal", title: schedule.title, starts_at: startsAt, ends_at: end.toISOString(), timezone: schedule.timezone, status: "scheduled", is_makeup: false, original_event_id: null, reminder_minutes: 30, notes: schedule.notes || null, recurring_schedule_id: schedule.id });
      }
    }
  }
  if (!inserts.length) return { data: [], error: null };
  const result = await database.from("events").insert(inserts).select();
  return result;
}
