import { supabase } from "./supabase";

export type Student = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  country_code: string | null;
  timezone: string | null;
  native_language: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  monthly_hours: number;
  status: "active" | "paused" | "archived" | "waiting";
  notes: string | null;
};

export async function getStudents() {
  if (!supabase) return { data: [], error: new Error("Supabase environment variables are missing") };
  return supabase.from("students").select("*").order("full_name");
}

export async function createStudent(input: Partial<Student> & { full_name: string }) {
  if (!supabase) return { data: null, error: new Error("Supabase environment variables are missing") };
  return supabase.from("students").insert(input).select().single();
}

export async function getUpcomingEvents(from: string, to: string) {
  if (!supabase) return { data: [], error: new Error("Supabase environment variables are missing") };
  return supabase.from("events").select("*, students(full_name)").gte("starts_at", from).lt("starts_at", to).order("starts_at");
}

export async function getStudentReports(studentId: string) {
  if (!supabase) return { data: [], error: new Error("Supabase environment variables are missing") };
  return supabase.from("events").select("id, starts_at, ends_at, status, lesson_reports(*)").eq("student_id", studentId).order("starts_at", { ascending: false });
}
