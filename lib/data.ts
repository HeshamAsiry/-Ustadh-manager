import { supabase } from "./supabase";

export async function getStudents() {
  if (!supabase) return { data: [], error: new Error("Supabase is not configured") };
  return supabase.from("students").select("*, learning_paths(*, subjects(*), curricula(*))").order("created_at", { ascending: false });
}

export async function createStudent(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("students").insert(input).select().single();
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("students").update(input).eq("id", id).select().single();
}

export async function deleteStudent(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("students").delete().eq("id", id);
}

export async function getLessons(from: string, to: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lessons").select("*, students(id,name,country,timezone)").gte("starts_at", from).lt("starts_at", to).order("starts_at");
}

export async function createLesson(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lessons").insert(input).select("*, students(id,name,country,timezone)").single();
}

export async function updateLesson(id: string, input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lessons").update(input).eq("id", id).select().single();
}

export async function deleteLesson(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lessons").delete().eq("id", id);
}

export async function getReport(lessonId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lesson_reports").select("*, lesson_report_items(*, subjects(*))").eq("lesson_id", lessonId).maybeSingle();
}

export async function upsertReport(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lesson_reports").upsert(input, { onConflict: "lesson_id" }).select().single();
}

export async function deleteReport(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("lesson_reports").delete().eq("id", id);
}
