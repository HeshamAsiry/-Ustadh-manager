import { supabase } from "./supabase";

export async function getCurrentUser() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth.signOut();
}

export async function signIn(email:string,password:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth.signInWithPassword({email,password});
}

export async function signUp(email:string,password:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase.auth.signUp({email,password});
}
