import { supabase } from "./supabase";

export async function getTeacherBlocks(from:string,to:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("teacher_blocks").select("*").lt("starts_at",to).gt("ends_at",from).order("starts_at");
}
export async function createTeacherBlock(input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("teacher_blocks").insert(input).select().single();
}
export async function updateTeacherBlock(id:string,input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("teacher_blocks").update(input).eq("id",id).select().single();
}
export async function deleteTeacherBlock(id:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.from("teacher_blocks").delete().eq("id",id);
}
