import { supabase } from "./supabase";

export async function getStudentProfile(studentId: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Authentication required");
  const teacherId = auth.user.id;

  const [{ data: student, error }, { data: lessons }, { data: reports }, { data: homework }, { data: quran }, { data: exams }] = await Promise.all([
    supabase.from("students").select("*, student_subjects(*, subjects(*)), learning_paths(*)").eq("id", studentId).eq("teacher_id", teacherId).single(),
    supabase.from("events").select("*").eq("student_id", studentId).eq("teacher_id", teacherId).order("starts_at", { ascending: false }),
    supabase.from("lesson_reports").select("*, lesson_report_items(*, subjects(*))").eq("student_id", studentId).eq("teacher_id", teacherId).order("created_at", { ascending: false }),
    supabase.from("homework").select("*").eq("student_id", studentId).eq("teacher_id", teacherId).order("due_date"),
    supabase.from("quran_progress").select("*").eq("student_id", studentId).eq("teacher_id", teacherId).order("updated_at", { ascending: false }),
    supabase.from("exams").select("*").eq("student_id", studentId).eq("teacher_id", teacherId).order("scheduled_at", { ascending: false })
  ]);
  if (error) throw error;
  return { student, lessons: lessons ?? [], reports: reports ?? [], homework: homework ?? [], quran: quran ?? [], exams: exams ?? [] };
}
