import { supabase } from "./supabase";

export async function createMakeup(input: {student_id:string; original_event_id?:string; starts_at:string; ends_at:string; timezone:string; title?:string; notes?:string}) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("events").insert({...input,event_type:"lesson",is_makeup:true}).select().single();
}

export async function cancelLesson(id:string, notes?:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("events").update({status:"cancelled",notes}).eq("id",id).select().single();
}

export async function rescheduleLesson(id:string, starts_at:string, ends_at:string, timezone:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("events").update({starts_at,ends_at,timezone}).eq("id",id).select().single();
}
