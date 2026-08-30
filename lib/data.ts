import { supabase } from "./supabase";
import { requireTeacherId } from "./current-teacher";

function db() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export async function getProfile() {
  const teacher_id = await requireTeacherId();
  return db().from("profiles").select("*").eq("id", teacher_id).single();
}

export async function updateProfile(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("profiles").update(input).eq("id", teacher_id).select().single();
}

export async function getStudents(status?: string) {
  const teacher_id = await requireTeacherId();
  let q = db().from("students").select("*, student_subjects(subject_id, subjects(*)), learning_paths(*)").eq("teacher_id", teacher_id).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  return q;
}

export async function getStudent(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("students").select("*, student_subjects(subject_id, subjects(*)), learning_paths(*)").eq("id", id).eq("teacher_id", teacher_id).single();
}

export async function createStudent(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("students").insert({ ...input, teacher_id }).select().single();
}

export async function updateStudent(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("students").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteStudent(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("students").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function setStudentSubjects(studentId: string, subjectIds: string[]) {
  const teacher_id = await requireTeacherId();
  const { data: student, error: studentError } = await db().from("students").select("id").eq("id", studentId).eq("teacher_id", teacher_id).single();
  if (studentError) return { data: null, error: studentError };
  const deleteResult = await db().from("student_subjects").delete().eq("student_id", student.id);
  if (deleteResult.error) return { data: null, error: deleteResult.error };
  if (!subjectIds.length) return { data: [], error: null };
  const rows = subjectIds.map((subject_id) => ({ student_id: studentId, subject_id }));
  return db().from("student_subjects").insert(rows).select();
}

export async function getEvents(from: string, to: string) {
  const teacher_id = await requireTeacherId();
  return db().from("events").select("*, students(id,full_name,country_code,timezone)").eq("teacher_id", teacher_id).gte("starts_at", from).lt("starts_at", to).order("starts_at");
}

export async function createEvent(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("events").insert({ ...input, teacher_id }).select("*, students(id,full_name,country_code,timezone)").single();
}

export async function updateEvent(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("events").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteEvent(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("events").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function hasEventConflict(start: string, end: string, excludeId?: string) {
  const teacher_id = await requireTeacherId();
  let events = db().from("events").select("id,title,starts_at,ends_at,status").eq("teacher_id", teacher_id).lt("starts_at", end).gt("ends_at", start).neq("status", "cancelled");
  if (excludeId) events = events.neq("id", excludeId);
  const eventResult = await events;
  if (eventResult.error || eventResult.data?.length) return { ...eventResult, conflict: Boolean(eventResult.data?.length), conflictType: "event" };
  const blockResult = await db().from("teacher_blocks").select("id,title,starts_at,ends_at").eq("teacher_id", teacher_id).lt("starts_at", end).gt("ends_at", start);
  if (blockResult.error || blockResult.data?.length) return { ...blockResult, conflict: Boolean(blockResult.data?.length), conflictType: "teacher_block" };
  return { data: [], error: null, conflict: false, conflictType: null };
}

export async function getReport(eventId: string) {
  const teacher_id = await requireTeacherId();
  return db().from("lesson_reports").select("*, lesson_report_items(*, subjects(*))").eq("event_id", eventId).eq("teacher_id", teacher_id).maybeSingle();
}

export async function upsertReport(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("lesson_reports").upsert({ ...input, teacher_id }, { onConflict: "event_id" }).select().single();
}

export async function deleteReport(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("lesson_reports").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getQuranProgress(studentId: string) {
  const teacher_id = await requireTeacherId();
  return db().from("quran_progress").select("*").eq("student_id", studentId).eq("teacher_id", teacher_id).order("date_recorded", { ascending: false });
}

export async function createQuranProgress(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("quran_progress").insert({ ...input, teacher_id }).select().single();
}

export async function updateQuranProgress(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("quran_progress").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteQuranProgress(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("quran_progress").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getExams(studentId?: string) {
  const teacher_id = await requireTeacherId();
  let q = db().from("exams").select("*, students(id,full_name)").eq("teacher_id", teacher_id).order("scheduled_at");
  if (studentId) q = q.eq("student_id", studentId);
  return q;
}

export async function createExam(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("exams").insert({ ...input, teacher_id }).select().single();
}

export async function updateExam(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("exams").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteExam(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("exams").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getLearningPaths() {
  const teacher_id = await requireTeacherId();
  return db().from("learning_paths").select("*, students(id,full_name), subjects(id,name_ar,name_fr,name_en), curricula(id,name,description)").eq("teacher_id", teacher_id).order("created_at", { ascending: false });
}

export async function createLearningPath(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("learning_paths").insert({ ...input, teacher_id }).select().single();
}

export async function updateLearningPath(id: string, input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("learning_paths").update(input).eq("id", id).eq("teacher_id", teacher_id).select().single();
}

export async function deleteLearningPath(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("learning_paths").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getTeacherBlocks() {
  const teacher_id = await requireTeacherId();
  return db().from("teacher_blocks").select("*").eq("teacher_id", teacher_id).order("starts_at");
}

export async function createTeacherBlock(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("teacher_blocks").insert({ ...input, teacher_id }).select().single();
}

export async function deleteTeacherBlock(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("teacher_blocks").delete().eq("id", id).eq("teacher_id", teacher_id);
}

export async function getAvailabilityRules() {
  const teacher_id = await requireTeacherId();
  return db().from("availability_rules").select("*").eq("teacher_id", teacher_id).order("weekday").order("start_time");
}

export async function replaceAvailabilityRules(rows: Record<string, unknown>[]) {
  const teacher_id = await requireTeacherId();
  const cleared = await db().from("availability_rules").delete().eq("teacher_id", teacher_id);
  if (cleared.error) return cleared;
  if (!rows.length) return { data: [], error: null };
  return db().from("availability_rules").insert(rows.map((row) => ({ ...row, teacher_id }))).select();
}

export async function getAvailabilityExceptions() {
  const teacher_id = await requireTeacherId();
  return db().from("availability_exceptions").select("*").eq("teacher_id", teacher_id).order("exception_date");
}

export async function createAvailabilityException(input: Record<string, unknown>) {
  const teacher_id = await requireTeacherId();
  return db().from("availability_exceptions").insert({ ...input, teacher_id }).select().single();
}

export async function deleteAvailabilityException(id: string) {
  const teacher_id = await requireTeacherId();
  return db().from("availability_exceptions").delete().eq("id", id).eq("teacher_id", teacher_id);
}
