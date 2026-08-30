import { supabase } from "./supabase";

export async function hasLessonConflict(teacherId: string, start: string, end: string, excludeId?: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  let query = supabase.from("lessons").select("id,starts_at,ends_at").eq("teacher_id", teacherId).lt("starts_at", end).gt("ends_at", start).neq("status", "cancelled");
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  return { conflict: !!data?.length, data, error };
}

export async function getPersonalEvents(teacherId: string, from: string, to: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("personal_events").select("*").eq("teacher_id", teacherId).lt("starts_at", to).gt("ends_at", from).order("starts_at");
}

export async function createPersonalEvent(input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("personal_events").insert(input).select().single();
}

export async function updatePersonalEvent(id: string, input: Record<string, unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("personal_events").update(input).eq("id", id).select().single();
}

export async function deletePersonalEvent(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("personal_events").delete().eq("id", id);
}
