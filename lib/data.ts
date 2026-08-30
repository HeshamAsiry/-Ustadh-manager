import { supabase } from "./supabase";
import { requireTeacherId } from "./current-teacher";

function db() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function getStudents() {
  return db().from("students").select("*, student_subjects(subject_id, subjects(*)), learning_paths(*)").order("created_at", { ascending: false });
}

export async function createStudent(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("students").insert({ ...input, teacher_id }).select().single();
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("students").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteStudent(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("students").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getEvents(from: string, to: string) {
  return db().from("events").select("*, students(id,full_name,country_code,timezone)").gte("starts_at", from).lt("starts_at", to).order("starts_at");
}

export async function createEvent(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("events").insert({ ...input, teacher_id }).select("*, students(id,full_name,country_code,timezone)").single();
}

export async function updateEvent(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("events").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteEvent(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("events").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function hasEventConflict(start: string, end: string, excludeId?: string) {
  let q = db().from("events").select("id,title,starts_at,ends_at,status").lt("starts_at", end).gt("ends_at", start).neq("status", "cancelled");
  if (excludeId) q = q.neq("id", excludeId);
  const result = await q;
  return { ...result, conflict: Boolean(result.data?.length) };
}

export async function getReport(eventId: string) {
  return db().from("lesson_reports").select("*, lesson_report_items(*, subjects(*))").eq("event_id", eventId).maybeSingle();
}

export async function upsertReport(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("lesson_reports").upsert({ ...input, teacher_id }, { onConflict: "event_id" }).select().single();
}

export async function deleteReport(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("lesson_reports").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getQuranProgress(studentId: string) {
  return db().from("quran_progress").select("*").eq("student_id", studentId).order("date_recorded", { ascending: false });
}

export async function createQuranProgress(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("quran_progress").insert({ ...input, teacher_id }).select().single();
}

export async function getExams(studentId?: string) {
  let q = db().from("exams").select("*, students(id,full_name)").order("scheduled_at");
  if (studentId) q = q.eq("student_id", studentId);
  return q;
}

export async function createExam(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("exams").insert({ ...input, teacher_id }).select().single();
}

export async function updateExam(id: string, input: Record<string, unknown>) {
  return db().from("exams").update(input).eq("id", id).select().single();
}
