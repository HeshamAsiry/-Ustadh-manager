import { supabase } from "./supabase";

export async function getHomework(studentId:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("homework").select("*").eq("student_id",studentId).order("due_at",{ascending:true});
}
export async function createHomework(input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("homework").insert(input).select().single();
}
export async function updateHomework(id:string,input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("homework").update(input).eq("id",id).select().single();
}
export async function deleteHomework(id:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("homework").delete().eq("id",id);
}
