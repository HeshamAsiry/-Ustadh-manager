import { supabase } from "./supabase";

export async function requireTeacherId() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Authentication required");
  return data.user.id;
}
