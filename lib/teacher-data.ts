import { supabase } from "./supabase";

async function teacherId() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Authentication required");
  return data.user.id;
}

export async function createTeacherOwned(table:string, input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  const id=await teacherId();
  return supabase.from(table).insert({...input,teacher_id:id}).select().single();
}

export async function updateTeacherOwned(table:string,id:string,input:Record<string,unknown>) {
  if (!supabase) throw new Error("Supabase is not configured");
  const tid=await teacherId();
  return supabase.from(table).update(input).eq("id",id).eq("teacher_id",tid).select().single();
}

export async function deleteTeacherOwned(table:string,id:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const tid=await teacherId();
  return supabase.from(table).delete().eq("id",id).eq("teacher_id",tid);
}
