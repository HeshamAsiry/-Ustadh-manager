import { supabase } from "./supabase";

export async function getQuranProgress(studentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("quran_progress").select("*").eq("student_id", studentId).order("updated_at", { ascending:false });
}
export async function upsertQuranProgress(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("quran_progress").upsert(input).select().single();
}
export async function getExams(studentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("exams").select("*").eq("student_id", studentId).order("scheduled_at");
}
export async function createExam(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("exams").insert(input).select().single();
}
export async function updateExam(id: string, input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("exams").update(input).eq("id", id).select().single();
}
export async function deleteExam(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("exams").delete().eq("id", id);
}

export function monthlyHours(lessons: { starts_at:string; ends_at:string; status?:string }[], year:number, month:number) {
  return lessons.filter(l => { const d=new Date(l.starts_at); return d.getFullYear()===year && d.getMonth()===month && l.status !== "cancelled"; })
    .reduce((sum,l)=>sum + Math.max(0,(new Date(l.ends_at).getTime()-new Date(l.starts_at).getTime())/3600000),0);
}
