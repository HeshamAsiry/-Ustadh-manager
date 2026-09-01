import { supabase } from "./supabase";
import { requireTeacherId } from "./current-teacher";
import { zonedDateTimeToUtc } from "./timezone";

type RecurringInput = { student_id?: string | null; title: string; weekday: number; start_time: string; duration_minutes: number; timezone: string; starts_on: string; ends_on?: string | null; notes?: string | null };
function db() { if (!supabase) throw new Error("Supabase is not configured"); return supabase; }

export async function createRecurringSchedule(input: RecurringInput) {
  const teacher_id = await requireTeacherId(); const database = db();
  const query = database.from("recurring_schedules").select("id").eq("teacher_id", teacher_id).eq("status", "active").eq("weekday", input.weekday).eq("start_time", input.start_time).eq("timezone", input.timezone).eq("title", input.title);
  const { data: existing, error: lookupError } = input.student_id ? await query.eq("student_id", input.student_id).limit(1).maybeSingle() : await query.is("student_id", null).limit(1).maybeSingle();
  if (lookupError) return { data: null, error: lookupError }; if (existing) return { data: existing, error: null };
  return database.from("recurring_schedules").insert({ ...input, teacher_id, status: "active" }).select().single();
}

export async function updateRecurringSchedule(id: string, input: Partial<RecurringInput> & { status?: string; ends_on?: string | null }) {
  const teacher_id = await requireTeacherId(); const database = db();
  const { data: current, error } = await database.from("recurring_schedules").select("id,student_id,title,start_time,timezone,status").eq("id", id).eq("teacher_id", teacher_id).maybeSingle();
  if (error) return { data: null, error }; if (!current) return { data: null, error: new Error("لم يتم العثور على التكرار المطلوب.") };

  const retireFutureEvents = async (scheduleIds: string[]) => {
    if (!scheduleIds.length) return null;
    const nowIso = new Date().toISOString();
    const result = await database.from("events").update({ status: "cancelled" }).eq("teacher_id", teacher_id).in("recurring_schedule_id", scheduleIds).eq("status", "scheduled").gte("starts_at", nowIso);
    return result.error || null;
  };

  // Multi-day recurrence is represented by sibling schedules in the current schema.
  // When one is edited, retire all matching siblings and their future generated
  // events; the caller then recreates exactly the selected weekdays.
  let siblingIds: string[] = [];
  if (current.status === "active") {
    let q = database.from("recurring_schedules").select("id").eq("teacher_id", teacher_id).eq("status", "active").eq("title", current.title).eq("start_time", current.start_time).eq("timezone", current.timezone);
    q = current.student_id ? q.eq("student_id", current.student_id) : q.is("student_id", null);
    const siblings = await q;
    if (siblings.error) return { data: null, error: siblings.error };
    siblingIds = (siblings.data || []).map((row: any) => row.id).filter((value: string) => value !== id);
    const eventError = await retireFutureEvents([id, ...siblingIds]);
    if (eventError) return { data: null, error: eventError };
    if (input.status !== "cancelled" && siblingIds.length) {
      const cancelResult = await database.from("recurring_schedules").update({ status: "cancelled" }).eq("teacher_id", teacher_id).in("id", siblingIds);
      if (cancelResult.error) return { data: null, error: cancelResult.error };
    }
  }
  return database.from("recurring_schedules").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function cancelRecurringSchedule(id: string) {
  const teacher_id = await requireTeacherId(); const database = db();
  const { data: current, error } = await database.from("recurring_schedules").select("id,student_id,title,start_time,timezone").eq("id", id).eq("teacher_id", teacher_id).maybeSingle();
  if (error) return { data: null, error }; if (!current) return { data: null, error: new Error("لم يتم العثور على التكرار المطلوب.") };
  let q = database.from("recurring_schedules").update({ status: "cancelled" }).eq("teacher_id", teacher_id).eq("status", "active").eq("title", current.title).eq("start_time", current.start_time).eq("timezone", current.timezone);
  q = current.student_id ? q.eq("student_id", current.student_id) : q.is("student_id", null);
  const result = await q;
  if (result.error) return { data: null, error: result.error };
  const eventResult = await database.from("events").update({ status: "cancelled" }).eq("teacher_id", teacher_id).eq("status", "scheduled").gte("starts_at", new Date().toISOString()).not("recurring_schedule_id", "is", null);
  if (eventResult.error) return { data: null, error: eventResult.error };
  return { data: current, error: null };
}

export async function syncRecurringSchedules(days = 90) {
  const teacher_id = await requireTeacherId(); const database = db();
  const { data: schedules, error } = await database.from("recurring_schedules").select("*").eq("teacher_id", teacher_id).eq("status", "active");
  if (error) return { data: null, error }; if (!schedules?.length) return { data: [], error: null };
  const today = new Date(); today.setHours(0, 0, 0, 0); const horizon = new Date(today); horizon.setDate(horizon.getDate() + days);
  const fromIso = new Date(today.getTime() - 86400000).toISOString(); const toIso = new Date(horizon.getTime() + 86400000).toISOString();
  const { data: existing, error: existingError } = await database.from("events").select("id,recurring_schedule_id,starts_at").eq("teacher_id", teacher_id).not("recurring_schedule_id", "is", null).gte("starts_at", fromIso).lt("starts_at", toIso).neq("status", "cancelled");
  if (existingError) return { data: null, error: existingError };
  const existingKeys = new Set((existing || []).map((e: any) => `${e.recurring_schedule_id}|${e.starts_at}`)); const inserts: any[] = [];
  for (const schedule of schedules as any[]) {
    const first = new Date(`${schedule.starts_on}T00:00:00`); const startDate = new Date(Math.max(today.getTime(), first.getTime())); const scheduleEnd = schedule.ends_on ? new Date(`${schedule.ends_on}T23:59:59`) : null;
    for (let cursor = new Date(startDate); cursor < horizon; cursor.setDate(cursor.getDate() + 1)) {
      if (scheduleEnd && cursor > scheduleEnd) break; if (cursor.getDay() !== Number(schedule.weekday)) continue;
      const localDate = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`; const start = zonedDateTimeToUtc(localDate, String(schedule.start_time).slice(0, 5), schedule.timezone); const end = new Date(start.getTime() + Number(schedule.duration_minutes || 60) * 60000); const startsAt = start.toISOString(); const key = `${schedule.id}|${startsAt}`;
      if (!existingKeys.has(key)) { existingKeys.add(key); inserts.push({ teacher_id, student_id: schedule.student_id, event_type: schedule.student_id ? "lesson" : "personal", title: schedule.title, starts_at: startsAt, ends_at: end.toISOString(), timezone: schedule.timezone, status: "scheduled", is_makeup: false, original_event_id: null, reminder_minutes: 30, notes: schedule.notes || null, recurring_schedule_id: schedule.id }); }
    }
  }
  if (!inserts.length) return { data: [], error: null };
  return database.from("events").upsert(inserts, { onConflict: "recurring_schedule_id,starts_at", ignoreDuplicates: true }).select();
}
