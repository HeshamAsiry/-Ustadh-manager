"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import * as ct from "countries-and-timezones";
import {
  Archive, BookOpenCheck, CalendarDays, Check, ChevronLeft, Clock3,
  FileText, Globe2, Mail, MapPin, Pencil, Phone, Plus, Search,
  UserRound, Users, X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { countryFlag } from "../../lib/country";
import "./students.css";
import "./students-overrides.css";

type Student = {
  id: string;
  full_name: string;
  age: number | null;
  country_code: string | null;
  timezone: string;
  native_language: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  compensation_type: "virtual_currency" | "center";
  currency_code: string | null;
  center_name: string | null;
  center_number: string | null;
  monthly_hours: number;
  status: "active" | "paused" | "archived";
  notes: string | null;
  created_at: string;
};

type Subject = { id: string; name_ar: string; name_fr: string | null; name_en: string | null };
type CountryRow = { id: string; code: string; name_ar: string; name_en: string | null; timezone: string; teacher_id: string | null; is_active: boolean };
type CountryOption = { code: string; nameAr: string; nameEn: string; timezones: string[] };
type DetailLesson = {
  starts_at: string;
  ends_at: string;
  title: string;
  status: string;
  is_makeup: boolean;
  notes: string | null;
  lesson_reports?: { taught_text: string | null; review_text: string | null; homework_text: string | null }[] | null;
};

type FormState = {
  full_name: string;
  age: string;
  country_code: string;
  timezone: string;
  native_language: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  compensation_type: "virtual_currency" | "center";
  currency_code: string;
  center_name: string;
  center_number: string;
  monthly_hours: string;
  status: "active" | "paused" | "archived";
  notes: string;
  subject_ids: string[];
};

const regionNames = new Intl.DisplayNames(["ar"], { type: "region" });
const rawPackageCountries = Object.values(ct.getAllCountries() as Record<string, { id: string; name: string; timezones: string[] }>).map((c) => ({
  code: c.id,
  nameAr: regionNames.of(c.id) || c.name,
  nameEn: c.name,
  timezones: c.timezones,
}));
const palestineSource = rawPackageCountries.find((c) => c.code === "PS");
const packageCountries = [
  ...rawPackageCountries.filter((c) => c.code !== "IL" && c.code !== "PS"),
  { code: "PS", nameAr: "فلسطين", nameEn: "Palestine", timezones: palestineSource?.timezones || ["Asia/Gaza", "Asia/Hebron"] },
].sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));

const currencies = [
  ["EUR", "اليورو (€)"], ["USD", "الدولار الأمريكي ($)"], ["GBP", "الجنيه الإسترليني (£)"],
  ["EGP", "الجنيه المصري (ج.م)"], ["AED", "الدرهم الإماراتي (د.إ)"], ["SAR", "الريال السعودي (ر.س)"],
  ["QAR", "الريال القطري (ر.ق)"], ["KWD", "الدينار الكويتي (د.ك)"], ["CAD", "الدولار الكندي (C$)"],
  ["AUD", "الدولار الأسترالي (A$)"], ["CHF", "الفرنك السويسري (CHF)"], ["MAD", "الدرهم المغربي (د.م)"],
  ["TRY", "الليرة التركية (₺)"],
] as const;
const emptySubject = { name_ar: "", name_fr: "", name_en: "" };
const emptyForm: FormState = {
  full_name: "", age: "", country_code: "", timezone: "", native_language: "",
  contact_name: "", contact_email: "", contact_phone: "", compensation_type: "virtual_currency",
  currency_code: "EUR", center_name: "", center_number: "", monthly_hours: "8", status: "active", notes: "", subject_ids: [],
};
const statusLabel = { active: "نشط", paused: "متوقف مؤقتًا", archived: "مؤرشف" } as const;
const initials = (name: string) => name.trim().slice(0, 2) || "ط";
const formatDate = (value: string) => new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const formatTime = (value: string) => new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const duration = (start: string, end: string) => Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));

export default function StudentsPageV2() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dbCountries, setDbCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Student["status"]>("all");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [addCountryOpen, setAddCountryOpen] = useState(false);
  const [addCountryQuery, setAddCountryQuery] = useState("");
  const [addingCountry, setAddingCountry] = useState(false);
  const [subjectCreateOpen, setSubjectCreateOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "lessons" | "statement">("overview");
  const [detailLessons, setDetailLessons] = useState<DetailLesson[]>([]);
  const [detailSubjects, setDetailSubjects] = useState<Subject[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentHours, setStudentHours] = useState<Record<string, number>>({});
  const [lessonStudent, setLessonStudent] = useState<Student | null>(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonForm, setLessonForm] = useState({ date: new Date().toISOString().slice(0, 10), time: "", minutes: "60", notes: "" });
  const [centerReportStudent, setCenterReportStudent] = useState<Student | null>(null);
  const [centerReportOpen, setCenterReportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, sub, c] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("subjects").select("id,name_ar,name_fr,name_en").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("countries").select("id,code,name_ar,name_en,timezone,teacher_id,is_active").eq("is_active", true),
    ]);
    if (!s.error) setStudents((s.data || []) as Student[]);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const { data: hourRows } = await supabase
      .from("events")
      .select("student_id,starts_at,ends_at")
      .eq("event_type", "lesson")
      .eq("status", "completed")
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", nextMonth.toISOString());
    const hourMap: Record<string, number> = {};
    (hourRows || []).forEach((row: any) => {
      const minutes = Math.max(0, (new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) / 60000);
      hourMap[row.student_id] = (hourMap[row.student_id] || 0) + minutes / 60;
    });
    setStudentHours(hourMap);
    if (!sub.error) setSubjects((sub.data || []) as Subject[]);
    if (!c.error) setDbCountries((c.data || []).filter((row: any) => row.code !== "IL") as CountryRow[]);
    if (s.error) setMessage(s.error.message);
    if (sub.error) setMessage(sub.error.message);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const countries = useMemo<CountryOption[]>(() => {
    const map = new Map(packageCountries.map((c) => [c.code, c]));
    dbCountries.filter((c) => c.code !== "IL").forEach((c) => map.set(c.code, {
      code: c.code,
      nameAr: c.name_ar,
      nameEn: c.name_en || c.name_ar,
      timezones: [c.timezone],
    }));
    return [...map.values()];
  }, [dbCountries]);

  const countryByCode = (code: string) => countries.find((c) => c.code === code);
  const popularCountries = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((s) => { if (s.country_code && s.country_code !== "IL") counts.set(s.country_code, (counts.get(s.country_code) || 0) + 1); });
    return countries.filter((c) => counts.has(c.code)).sort((a, b) => ((counts.get(b.code) || 0) - (counts.get(a.code) || 0)) || a.nameAr.localeCompare(b.nameAr, "ar")).slice(0, 10);
  }, [countries, students]);
  const searchedCountries = useMemo(() => {
    const q = countryQuery.trim().toLocaleLowerCase("ar");
    const base = q ? countries.filter((c) => `${c.nameAr} ${c.nameEn} ${c.code}`.toLocaleLowerCase("ar").includes(q)) : popularCountries;
    return base.slice(0, 40);
  }, [countries, popularCountries, countryQuery]);
  const allCountriesForAdd = useMemo(() => {
    const q = addCountryQuery.trim().toLocaleLowerCase("ar");
    return countries.filter((c) => !q || `${c.nameAr} ${c.nameEn} ${c.code}`.toLocaleLowerCase("ar").includes(q));
  }, [countries, addCountryQuery]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ar");
    return students.filter((s) => (!q || `${s.full_name} ${s.contact_name || ""} ${s.contact_email || ""}`.toLocaleLowerCase("ar").includes(q)) && (statusFilter === "all" || s.status === statusFilter));
  }, [students, query, statusFilter]);
  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    paused: students.filter((s) => s.status === "paused").length,
    hours: students.reduce((sum, s) => sum + Number(s.monthly_hours || 0), 0),
  }), [students]);

  const selectCountry = (code: string) => {
    const c = countryByCode(code);
    if (!c || code === "IL") return;
    setForm((current) => ({ ...current, country_code: code, timezone: c.timezones[0] || "" }));
    setCountryPickerOpen(false);
    setCountryQuery("");
  };

  const openCreate = () => {
    const first = popularCountries[0];
    setEditingId(null);
    setForm(first ? { ...emptyForm, country_code: first.code, timezone: first.timezones[0] || "" } : { ...emptyForm });
    setCountryPickerOpen(false);
    setCountryQuery("");
    setSubjectCreateOpen(false);
    setSubjectForm(emptySubject);
    setMessage("");
    setFormOpen(true);
  };

  const openEdit = async (student: Student) => {
    const { data } = await supabase.from("student_subjects").select("subject_id").eq("student_id", student.id);
    setEditingId(student.id);
    setForm({
      full_name: student.full_name,
      age: student.age?.toString() || "",
      country_code: student.country_code || "",
      timezone: student.timezone,
      native_language: student.native_language || "",
      contact_name: student.contact_name || "",
      contact_email: student.contact_email || "",
      contact_phone: student.contact_phone || "",
      compensation_type: student.compensation_type || "virtual_currency",
      currency_code: student.currency_code || "EUR",
      center_name: student.center_name || "",
      center_number: student.center_number || "",
      monthly_hours: String(student.monthly_hours ?? 0),
      status: student.status,
      notes: student.notes || "",
      subject_ids: (data || []).map((row: any) => row.subject_id),
    });
    setCountryPickerOpen(false);
    setCountryQuery("");
    setSubjectCreateOpen(false);
    setSubjectForm(emptySubject);
    setFormOpen(true);
  };

  const addCountryFromDirectory = async (code: string) => {
    const c = countryByCode(code);
    if (!c || code === "IL") return;
    setAddingCountry(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setMessage("انتهت جلسة الدخول."); setAddingCountry(false); return; }
    const existing = dbCountries.find((row) => row.code === code);
    if (existing) {
      setForm((current) => ({ ...current, country_code: code, timezone: existing.timezone }));
      setAddCountryOpen(false); setAddCountryQuery(""); setCountryPickerOpen(false); setAddingCountry(false); return;
    }
    const payload = { code, name_ar: c.nameAr, name_en: c.nameEn, timezone: c.timezones[0] || "UTC", teacher_id: user.user.id };
    const { data, error } = await supabase.from("countries").insert(payload).select("id,code,name_ar,name_en,timezone,teacher_id,is_active").single();
    if (error && error.code !== "23505") { setMessage(error.message); setAddingCountry(false); return; }
    const saved = (data || { ...payload, id: `local-${code}`, is_active: true }) as CountryRow;
    setDbCountries((prev) => [...prev.filter((row) => row.code !== code), saved]);
    setForm((current) => ({ ...current, country_code: code, timezone: saved.timezone }));
    setAddCountryOpen(false); setAddCountryQuery(""); setCountryPickerOpen(false); setAddingCountry(false);
    setMessage(`تمت إضافة ${c.nameAr} واكتشاف المنطقة الزمنية تلقائيًا.`);
  };

  const createSubject = async (event: FormEvent) => {
    event.preventDefault();
    const nameAr = subjectForm.name_ar.trim();
    const nameFr = subjectForm.name_fr.trim();
    const nameEn = subjectForm.name_en.trim();
    if (!nameAr) { setMessage("اكتب اسم المادة بالعربية أولًا."); return; }
    if (subjects.some((s) => s.name_ar.trim().toLocaleLowerCase("ar") === nameAr.toLocaleLowerCase("ar"))) { setMessage("هذه المادة موجودة بالفعل."); return; }
    setSubjectSaving(true); setMessage("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setMessage("انتهت جلسة الدخول."); setSubjectSaving(false); return; }
    const sortOrder = subjects.length ? Math.max(...subjects.map((_, index) => index)) + 1 : 0;
    const { data, error } = await supabase.from("subjects").insert({ name_ar: nameAr, name_fr: nameFr || null, name_en: nameEn || null, is_active: true, sort_order: sortOrder, teacher_id: user.user.id }).select("id,name_ar,name_fr,name_en").single();
    if (error || !data) { setMessage(error?.message || "تعذر إضافة المادة."); setSubjectSaving(false); return; }
    const created = data as Subject;
    setSubjects((prev) => [...prev, created]);
    setForm((current) => ({ ...current, subject_ids: [...current.subject_ids, created.id] }));
    setSubjectForm(emptySubject); setSubjectCreateOpen(false); setSubjectSaving(false);
    setMessage(`تمت إضافة مادة «${created.name_ar}» وتحديدها للطالب.`);
  };

  const saveStudent = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = !form.full_name.trim() || !form.age || !form.country_code || form.country_code === "IL" || !form.timezone || !form.monthly_hours || !form.subject_ids.length || (form.compensation_type === "virtual_currency" && !form.currency_code) || (form.compensation_type === "center" && !form.center_name.trim());
    if (invalid) { setMessage("البيانات المطلوبة: الاسم، العمر، الدولة، الساعات الشهرية، مادة واحدة على الأقل، وتحديد طريقة التعامل."); return; }
    setSaving(true); setMessage("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setMessage("انتهت جلسة الدخول."); setSaving(false); return; }
    const payload = {
      full_name: form.full_name.trim(),
      age: Number(form.age), country_code: form.country_code, timezone: form.timezone,
      native_language: form.native_language.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      compensation_type: form.compensation_type,
      currency_code: form.compensation_type === "virtual_currency" ? form.currency_code : null,
      center_name: form.compensation_type === "center" ? form.center_name.trim() : null,
      center_number: form.compensation_type === "center" ? form.center_number.trim() : null,
      monthly_hours: Number(form.monthly_hours), status: form.status, notes: form.notes.trim() || null,
      teacher_id: user.user.id,
    };
    let id = editingId;
    if (editingId) {
      const { error } = await supabase.from("students").update(payload).eq("id", editingId);
      if (error) { setMessage(error.message); setSaving(false); return; }
      await supabase.from("student_subjects").delete().eq("student_id", editingId);
    } else {
      const { data, error } = await supabase.from("students").insert(payload).select("id").single();
      if (error || !data) { setMessage(error?.message || "تعذر حفظ الطالب."); setSaving(false); return; }
      id = data.id;
    }
    if (id) {
      const { error } = await supabase.from("student_subjects").insert(form.subject_ids.map((subject_id) => ({ student_id: id, subject_id })));
      if (error) { setMessage(error.message); setSaving(false); return; }
    }
    await load();
    setFormOpen(false); setCountryPickerOpen(false); setSubjectCreateOpen(false); setSaving(false);
    setMessage(editingId ? "تم تحديث بيانات الطالب." : "تمت إضافة الطالب بنجاح.");
  };

  const openDetails = async (student: Student) => {
    setSelected(student); setDetailTab("overview"); setDetailLoading(true);
    const [events, studentSubjects] = await Promise.all([
      supabase.from("events").select("starts_at,ends_at,title,status,is_makeup,notes,lesson_reports(taught_text,review_text,homework_text)").eq("student_id", student.id).order("starts_at", { ascending: false }).limit(50),
      supabase.from("student_subjects").select("subjects(id,name_ar,name_fr,name_en)").eq("student_id", student.id),
    ]);
    setDetailLessons((events.data || []) as DetailLesson[]);
    setDetailSubjects((studentSubjects.data || []).map((row: any) => row.subjects).filter(Boolean));
    setDetailLoading(false);
  };

  const archive = async (student: Student) => {
    const next = student.status === "archived" ? "active" : "archived";
    const { error } = await supabase.from("students").update({ status: next }).eq("id", student.id);
    if (error) { setMessage(error.message); return; }
    await load(); setSelected(null);
    setMessage(next === "archived" ? "تم أرشفة الطالب." : "تمت إعادة تفعيل الطالب.");
  };

  const completed = detailLessons.filter((lesson) => lesson.status === "completed");
  const totalMins = detailLessons.reduce((sum, lesson) => sum + duration(lesson.starts_at, lesson.ends_at), 0);

  const openLessonModal = (student: Student) => {
    setLessonStudent(student);
    setLessonForm({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), minutes: "60", notes: "" });
    setLessonOpen(true);
  };

  const saveRecordedLesson = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonStudent) return;
    const minutes = Math.max(1, Number(lessonForm.minutes || 0));
    const startsAt = new Date(`${lessonForm.date}T${lessonForm.time || "00:00"}:00`);
    const endsAt = new Date(startsAt.getTime() + minutes * 60000);
    if (Number.isNaN(startsAt.getTime())) { setMessage("اختر تاريخ ووقت الحصة."); return; }
    setLessonSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setMessage("انتهت جلسة الدخول."); setLessonSaving(false); return; }
    const { error } = await supabase.from("events").insert({
      student_id: lessonStudent.id,
      teacher_id: user.user.id,
      event_type: "lesson",
      title: `حصة — ${lessonStudent.full_name}`,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: "completed",
      is_makeup: false,
      reminder_minutes: 0,
      notes: lessonForm.notes.trim() || null,
    });
    if (error) { setMessage(error.message); setLessonSaving(false); return; }
    const newHours = (studentHours[lessonStudent.id] || 0) + minutes / 60;
    setStudentHours((current) => ({ ...current, [lessonStudent.id]: newHours }));
    setLessonOpen(false);
    setLessonSaving(false);
    const completed = newHours + 0.001 >= Number(lessonStudent.monthly_hours || 0);
    if (completed) {
      setMessage(`تم تسجيل الحصة. ${lessonStudent.full_name} أنهى ساعاته الشهرية المقررة.`);
      if (lessonStudent.compensation_type === "center") { setCenterReportStudent(lessonStudent); setCenterReportOpen(true); }
    } else {
      setMessage(`تم تسجيل ${minutes} دقيقة للطالب ${lessonStudent.full_name}.`);
    }
  };

  const centerReportText = centerReportStudent
    ? `السلام عليكم ورحمة الله وبركاته،\n\nنفيدكم بأن الطالب/ة ${centerReportStudent.full_name} قد أنهى/ت ساعاته/ا الشهرية المقررة لهذا الشهر.\n\nالتاريخ: ${new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}\nاسم الطالب: ${centerReportStudent.full_name}\nالمركز: ${centerReportStudent.center_name || "—"}\nرقم المركز: ${centerReportStudent.center_number || "—"}\n\nمع خالص التحية.`
    : "";

  const copyCenterReport = async () => {
    if (!centerReportText) return;
    await navigator.clipboard?.writeText(centerReportText);
    setMessage("تم نسخ تقرير المركز، وهو جاهز للإرسال.");
  };

  return (
    <main className="students-page" dir="rtl">
      <header className="students-topbar">
        <div><p className="eyebrow">إدارة الطلاب</p><h1>الطلاب</h1><p className="subtitle">ملفات الطلاب، المواد، الساعات والتقدم في مكان واحد.</p></div>
        <button className="primary-button" onClick={openCreate}><Plus size={17} /> إضافة طالب جديد</button>
      </header>

      {message && <div className="toast"><Check size={16} /><span>{message}</span><button onClick={() => setMessage("")}><X size={15} /></button></div>}

      <section className="students-stats">
        <div><span className="stat-icon"><Users size={18} /></span><div><strong>{stats.total}</strong><small>إجمالي الطلاب</small></div></div>
        <div><span className="stat-icon"><Check size={18} /></span><div><strong>{stats.active}</strong><small>طلاب نشطون</small></div></div>
        <div><span className="stat-icon"><Clock3 size={18} /></span><div><strong>{stats.hours.toFixed(1)}</strong><small>ساعات مقررة / شهر</small></div></div>
        <div><span className="stat-icon"><Archive size={18} /></span><div><strong>{stats.paused}</strong><small>متوقفون مؤقتًا</small></div></div>
      </section>

      <section className="students-panel">
        <div className="panel-head">
          <div><span className="section-index">01</span><div><h2>قائمة الطلاب</h2><p>{filtered.length} طالب مطابق للبحث الحالي</p></div></div>
          <div className="panel-tools"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم الطالب أو ولي الأمر..." /></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}><option value="all">كل الحالات</option><option value="active">نشط</option><option value="paused">متوقف مؤقتًا</option><option value="archived">مؤرشف</option></select></div>
        </div>
        {loading ? <div className="empty-state"><div className="loading-mark">ر</div><p>جارٍ تحميل الطلاب...</p></div> : filtered.length === 0 ? <div className="empty-state"><Users size={30} /><h3>لا يوجد طلاب مطابقون</h3><p>أضف طالبًا جديدًا أو عدّل البحث.</p></div> : <div className="student-list">{filtered.map((student) => <article className="student-row" key={student.id}>
          <div className="student-main"><div className="student-avatar">{initials(student.full_name)}</div><div><h3><span className="student-country-flag">{countryFlag(student.country_code)}</span>{student.full_name}</h3><p>{student.age ? `${student.age} سنة` : "العمر غير محدد"} · {countryByCode(student.country_code || "")?.nameAr || student.country_code || "الدولة غير محددة"}</p></div></div>
          <div className="student-cell subjects-cell"><span>المواد</span><div className="mini-subjects"><BookOpenCheck size={14} /><span>فتح ملف الطالب</span></div></div>
          <div className="student-cell"><span>الساعات الشهرية</span><strong>{Number(student.monthly_hours).toFixed(1)} ساعة</strong></div>
          <div className="student-cell"><span>المنطقة الزمنية</span><strong>{student.timezone.replace(/^.*\//, "").replaceAll("_", " ")}</strong></div>
          <div className="student-status"><span className={`status-badge ${student.status}`}>{statusLabel[student.status]}</span><small>منذ {formatDate(student.created_at)}</small></div>
          <div className="student-actions"><button type="button" className="record-lesson-button" onClick={() => openLessonModal(student)} title="تسجيل حصة"><Plus size={15} /></button><button onClick={() => openDetails(student)} aria-label={`فتح ملف ${student.full_name}`}><ChevronLeft size={17} /></button><button onClick={() => openEdit(student)} aria-label={`تعديل ${student.full_name}`}><Pencil size={16} /></button></div>
        </article>)}</div>}
      </section>

      <section className="students-guide"><div><span className="guide-icon"><FileText size={19} /></span><div><strong>كشف الطالب قابل للطباعة والإرسال</strong><p>كشف متابعة تعليمي بالدروس والساعات والإنجازات، بدون مستحقات أو بيانات مالية.</p></div></div><span className="guide-note">مناسب للإرسال لولي الأمر</span></section>

      {formOpen && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setFormOpen(false)}>
        <section className="student-modal form-modal student-form-modal">
          <header><div><span className="section-index">02</span><div><h2>{editingId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</h2><p>البيانات الأساسية للطالب، مع اختيار الدولة والمواد وطريقة التعامل.</p></div></div><button className="close-button" type="button" onClick={() => setFormOpen(false)}><X size={18} /></button></header>
          <form onSubmit={saveStudent}>
            <div className="form-grid">
              <label>اسم الطالب <em>*</em><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="مثال: هارون" /></label>
              <label>العمر <em>*</em><input required type="number" min="1" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="12" /></label>
              <label className="country-field">الدولة <em>*</em><div className="country-picker">
                <button type="button" className={`country-trigger ${countryPickerOpen ? "open" : ""}`} onClick={() => setCountryPickerOpen((value) => !value)}><Globe2 size={17} /><span>{form.country_code ? `${countryFlag(form.country_code)} ${countryByCode(form.country_code)?.nameAr || form.country_code}` : "اختر الدولة"}</span><ChevronLeft size={16} /></button>
                {countryPickerOpen && <div className="country-menu"><div className="country-menu-head"><div><strong>{popularCountries.length ? "الدول المستخدمة" : "اختر دولة"}</strong><small>{popularCountries.length ? "حتى ١٠ دول بها طلاب حاليًا" : "لا توجد دول محفوظة بعد"}</small></div><button type="button" className="country-add-link" onClick={() => { setAddCountryOpen(true); setAddCountryQuery(""); }}><Plus size={15} /> إضافة دولة</button></div><label className="country-search"><Search size={15} /><input autoFocus value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="ابحث عن دولة..." /><span>{countryQuery ? searchedCountries.length : popularCountries.length}</span></label><div className="country-options">{searchedCountries.map((country) => <button type="button" key={country.code} className={`country-option ${country.code === form.country_code ? "selected" : ""}`} onClick={() => selectCountry(country.code)}><span><span className="country-option-flag">{countryFlag(country.code)}</span>{country.nameAr}</span><small>{country.code}</small></button>)}{!searchedCountries.length && <div className="country-no-results">لا توجد نتيجة. استخدم «إضافة دولة» للبحث في كل الدول.</div>}</div></div>}
              </div></label>
              <label>المنطقة الزمنية <em>*</em><div className="timezone-control"><input readOnly value={form.timezone} placeholder="تظهر تلقائيًا" /><span>{form.country_code ? "تم التعرف عليها تلقائيًا من الدولة" : "اختر الدولة أولًا"}</span></div></label>
              <label>اللغة الأم<input value={form.native_language} onChange={(e) => setForm({ ...form, native_language: e.target.value })} placeholder="فرنسية / هولندية..." /></label>
              <label>الساعات الشهرية <em>*</em><input required type="number" min="0.5" step="0.5" value={form.monthly_hours} onChange={(e) => setForm({ ...form, monthly_hours: e.target.value })} /></label>

              <div className="compensation-field">
                <div className="compensation-label">طريقة التعامل <em>*</em></div>
                <div className="compensation-options">
                  <button type="button" className={form.compensation_type === "virtual_currency" ? "active" : ""} onClick={() => setForm({ ...form, compensation_type: "virtual_currency", center_name: "" })}><strong>عملة افتراضية</strong><small>تسجيل العملة التي يتعامل بها الطالب</small></button>
                  <button type="button" className={form.compensation_type === "center" ? "active" : ""} onClick={() => setForm({ ...form, compensation_type: "center", currency_code: "" })}><strong>تابع لمركز</strong><small>الطالب تابع لمركز تتعامل معه</small></button>
                </div>
                {form.compensation_type === "virtual_currency" ? <label className="compensation-dependent">العملة الافتراضية <em>*</em><select value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })}><option value="">اختر العملة</option>{currencies.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label> : <label className="compensation-dependent">اسم المركز <em>*</em><input value={form.center_name} onChange={(e) => setForm({ ...form, center_name: e.target.value })} placeholder="مثال: مركز النور" /></label>
    <label className="compensation-dependent">رقم المركز <em>*</em><input name="center_number" value={form.center_number} onChange={(e) => setForm({ ...form, center_number: e.target.value })} placeholder="مثال: 1024" /></label>}
              </div>

              <label>هاتف ولي الأمر<input dir="ltr" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></label>
              <label>بريد ولي الأمر<input dir="ltr" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></label>
              <label>الحالة<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}><option value="active">نشط</option><option value="paused">متوقف مؤقتًا</option><option value="archived">مؤرشف</option></select></label>
            </div>

            <div className="form-section subject-form-section"><div className="subject-section-head"><div><h3>المواد الدراسية <em>*</em></h3><p>اختر مادة واحدة أو أكثر للطالب.</p></div><button type="button" className="secondary-button subject-add-button" onClick={() => { setSubjectForm(emptySubject); setSubjectCreateOpen(true); }}><Plus size={15} /> إضافة مادة</button></div>{subjects.length ? <div className="subject-picker">{subjects.map((subject) => <button type="button" key={subject.id} className={form.subject_ids.includes(subject.id) ? "selected" : ""} onClick={() => setForm({ ...form, subject_ids: form.subject_ids.includes(subject.id) ? form.subject_ids.filter((id) => id !== subject.id) : [...form.subject_ids, subject.id] })}><span>{subject.name_ar}</span>{form.subject_ids.includes(subject.id) && <Check size={14} />}</button>)}</div> : <div className="subject-empty-state"><BookOpenCheck size={20} /><p>لا توجد مواد دراسية متاحة حاليًا.</p><button type="button" className="primary-button" onClick={() => setSubjectCreateOpen(true)}><Plus size={15} /> أضف أول مادة</button></div>}</div>
            <label className="full-field">ملاحظات<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات عامة عن الطالب..." /></label>
            <footer><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>إلغاء</button><button className="primary-button" disabled={saving}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الطالب"}</button></footer>
          </form>
        </section>
      </div>}

      {subjectCreateOpen && <div className="modal-backdrop subject-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !subjectSaving && setSubjectCreateOpen(false)}><section className="student-modal subject-create-modal"><header><div><span className="section-index">04</span><div><h2>إضافة مادة دراسية</h2><p>أضف المادة مرة واحدة وستظهر مباشرة في قائمة مواد الطلاب.</p></div></div><button className="close-button" type="button" disabled={subjectSaving} onClick={() => setSubjectCreateOpen(false)}><X size={18} /></button></header><form onSubmit={createSubject}><div className="form-grid subject-create-grid"><label>اسم المادة بالعربية <em>*</em><input autoFocus required value={subjectForm.name_ar} onChange={(e) => setSubjectForm({ ...subjectForm, name_ar: e.target.value })} placeholder="مثال: القرآن الكريم" /></label><label>اسم المادة بالفرنسية<input value={subjectForm.name_fr} onChange={(e) => setSubjectForm({ ...subjectForm, name_fr: e.target.value })} placeholder="Coran" /></label><label>اسم المادة بالإنجليزية<input value={subjectForm.name_en} onChange={(e) => setSubjectForm({ ...subjectForm, name_en: e.target.value })} placeholder="Quran" /></label></div><footer><button type="button" className="secondary-button" disabled={subjectSaving} onClick={() => setSubjectCreateOpen(false)}>إلغاء</button><button className="primary-button" disabled={subjectSaving}>{subjectSaving ? "جارٍ الإضافة..." : "إضافة المادة"}</button></footer></form></section></div>}

      {addCountryOpen && <div className="modal-backdrop country-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !addingCountry && setAddCountryOpen(false)}><section className="student-modal country-modal country-directory-modal"><header><div><span className="section-index">03</span><div><h2>إضافة دولة</h2><p>ابحث باسم الدولة واخترها. سيتم حفظها تلقائيًا واكتشاف المنطقة الزمنية.</p></div></div><button className="close-button" type="button" disabled={addingCountry} onClick={() => setAddCountryOpen(false)}><X size={18} /></button></header><div className="country-directory-body"><label className="country-search country-directory-search"><Search size={16} /><input autoFocus value={addCountryQuery} onChange={(e) => setAddCountryQuery(e.target.value)} placeholder="ابحث باسم الدولة أو بالإنجليزية أو ISO..." /><span>{allCountriesForAdd.length}</span></label><div className="country-directory-list">{allCountriesForAdd.map((country) => <button type="button" key={country.code} className="country-directory-option" disabled={addingCountry} onClick={() => addCountryFromDirectory(country.code)}><span><span className="country-option-flag">{countryFlag(country.code)}</span><strong>{country.nameAr}</strong><small>{country.nameEn}</small></span><b>{country.code}</b></button>)}</div></div></section></div>}

      {selected && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><section className="student-modal detail-modal"><header><div className="detail-heading"><div className="student-avatar large">{initials(selected.full_name)}</div><div><span className={`status-badge ${selected.status}`}>{statusLabel[selected.status]}</span><h2><span className="student-country-flag">{countryFlag(selected.country_code)}</span>{selected.full_name}</h2><p>{selected.age ? `${selected.age} سنة` : "العمر غير محدد"} · {countryByCode(selected.country_code || "")?.nameAr || selected.country_code || "الدولة غير محددة"} · {selected.timezone}</p></div></div><button className="close-button" type="button" onClick={() => setSelected(null)}><X size={18} /></button></header><div className="detail-tabs"><button className={detailTab === "overview" ? "active" : ""} onClick={() => setDetailTab("overview")}>نظرة عامة</button><button className={detailTab === "lessons" ? "active" : ""} onClick={() => setDetailTab("lessons")}>الحصص</button><button className={detailTab === "statement" ? "active" : ""} onClick={() => setDetailTab("statement")}>كشف المتابعة</button></div>{detailLoading ? <div className="empty-state compact"><div className="loading-mark">ر</div><p>جارٍ تحميل ملف الطالب...</p></div> : <>
        {detailTab === "overview" && <div className="detail-content"><div className="info-grid"><div><span><Clock3 size={15} /> الساعات الشهرية</span><strong>{Number(selected.monthly_hours).toFixed(1)} ساعة</strong></div><div><span><Globe2 size={15} /> المنطقة الزمنية</span><strong>{selected.timezone}</strong></div><div><span><MapPin size={15} /> الدولة</span><strong><span className="student-country-flag">{countryFlag(selected.country_code)}</span>{countryByCode(selected.country_code || "")?.nameAr || selected.country_code || "غير محددة"}</strong></div><div><span><UserRound size={15} /> اللغة الأم</span><strong>{selected.native_language || "غير محددة"}</strong></div><div><span><BookOpenCheck size={15} /> طريقة التعامل</span><strong>{selected.compensation_type === "center" ? `تابع لـ ${selected.center_name || "مركز"}` : `عملة ${selected.currency_code || ""}`}</strong></div></div><div className="detail-columns"><div className="detail-card"><div className="card-title"><h3>المواد الدراسية</h3><span>{detailSubjects.length}</span></div><div className="subject-chips">{detailSubjects.map((subject) => <span key={subject.id}><BookOpenCheck size={13} />{subject.name_ar}</span>)}</div></div><div className="detail-card"><div className="card-title"><h3>بيانات الاتصال</h3></div><div className="contact-list">{selected.contact_email && <span dir="ltr"><Mail size={14} />{selected.contact_email}</span>}{selected.contact_phone && <span dir="ltr"><Phone size={14} />{selected.contact_phone}</span>}{!selected.contact_email && !selected.contact_phone && <p className="muted">لا توجد بيانات اتصال.</p>}</div></div></div><div className="detail-card notes-card"><div className="card-title"><h3>ملاحظات المعلم</h3></div><p>{selected.notes || "لا توجد ملاحظات مسجلة."}</p></div><div className="detail-footer"><div><span className="guide-note">إدارة حالة الطالب</span></div><div><button className="secondary-button" onClick={() => openEdit(selected)}><Pencil size={15} /> تعديل</button><button className="danger-button" onClick={() => archive(selected)}>{selected.status === "archived" ? "إعادة تفعيل" : "أرشفة"}</button></div></div></div>}
        {detailTab === "lessons" && <div className="detail-content"><div className="mini-stats"><div><strong>{detailLessons.length}</strong><span>إجمالي الحصص</span></div><div><strong>{completed.length}</strong><span>مكتملة</span></div><div><strong>{(totalMins / 60).toFixed(1)}</strong><span>ساعة مسجلة</span></div></div><div className="lesson-list">{detailLessons.length ? detailLessons.map((lesson, index) => <div className="lesson-item" key={`${lesson.starts_at}-${index}`}><div className="lesson-time"><strong>{formatTime(lesson.starts_at)}</strong><span>{formatDate(lesson.starts_at)}</span></div><div className="lesson-body"><h3>{lesson.title}</h3><p>{lesson.lesson_reports?.[0]?.taught_text || lesson.notes || "لا يوجد وصف للحصة بعد."}</p></div><span className={`lesson-status ${lesson.status}`}>{lesson.status === "completed" ? "مكتملة" : lesson.is_makeup ? "تعويضية" : "مجدولة"}</span></div>) : <div className="empty-state compact"><CalendarDays size={28} /><p>لا توجد حصص مسجلة لهذا الطالب حتى الآن.</p></div>}</div></div>}
        {detailTab === "statement" && <div className="statement-wrap"><div className="statement-head"><div><span>رواق · إدارة التعليم</span><h2><span className="student-country-flag">{countryFlag(selected.country_code)}</span>كشف متابعة الطالب</h2><p>كشف تعليمي قابل للمشاركة مع ولي الأمر ولا يتضمن أي مستحقات أو بيانات مالية.</p></div><button className="secondary-button no-print" onClick={() => window.print()}><FileText size={15} /> طباعة / PDF</button></div><div className="statement-student"><div><span>الطالب</span><strong><span className="student-country-flag">{countryFlag(selected.country_code)}</span>{selected.full_name}</strong></div><div><span>الساعات الشهرية</span><strong>{Number(selected.monthly_hours).toFixed(1)} ساعة</strong></div><div><span>الحصص المكتملة</span><strong>{completed.length}</strong></div><div><span>الساعات المسجلة</span><strong>{(totalMins / 60).toFixed(1)} ساعة</strong></div></div><div className="statement-table"><div className="table-row table-head"><span>التاريخ</span><span>الحصة</span><span>المدة</span><span>الإنجاز / التقرير</span></div>{completed.length ? completed.slice(0, 20).map((lesson, index) => <div className="table-row" key={`${lesson.starts_at}-${index}`}><span>{formatDate(lesson.starts_at)}</span><span>{lesson.title}</span><span>{duration(lesson.starts_at, lesson.ends_at)} د</span><span>{lesson.lesson_reports?.[0]?.taught_text || lesson.lesson_reports?.[0]?.review_text || "تمت الحصة بنجاح."}</span></div>) : <div className="statement-empty">لا توجد حصص مكتملة مسجلة حتى الآن.</div>}</div><div className="statement-footer">رواق · تقرير متابعة تعليمي — بدون مستحقات مالية</div></div>}
      </>}</section></div>}
    
      {lessonOpen && lessonStudent ? <div className="modal-backdrop"><section className="student-modal lesson-record-modal"><header><div><h2>تسجيل حصة</h2><p>{lessonStudent.full_name}</p></div><button className="close-button" type="button" onClick={() => setLessonOpen(false)}><X size={16} /></button></header><form onSubmit={saveRecordedLesson}><div className="form-grid"><label>التاريخ<input type="date" value={lessonForm.date} onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })} required /></label><label>وقت الحصة<input type="time" value={lessonForm.time} onChange={(e) => setLessonForm({ ...lessonForm, time: e.target.value })} required /></label><label>مدة الحصة بالدقائق<input type="number" min="1" value={lessonForm.minutes} onChange={(e) => setLessonForm({ ...lessonForm, minutes: e.target.value })} required /></label><label className="full-field">ملاحظات الحصة<textarea value={lessonForm.notes} onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })} rows={3} /></label></div><footer className="detail-footer"><button type="button" className="secondary-button" onClick={() => setLessonOpen(false)}>إلغاء</button><button className="primary-button" type="submit" disabled={lessonSaving}><Plus size={15} />{lessonSaving ? "جارٍ التسجيل..." : "تسجيل الحصة"}</button></footer></form></section></div> : null}
      {centerReportOpen && centerReportStudent ? <div className="modal-backdrop"><section className="student-modal center-report-modal"><header><div><h2>تم إنهاء الساعات الشهرية</h2><p>{centerReportStudent.full_name} — {centerReportStudent.center_name || "المركز"}</p></div><button className="close-button" type="button" onClick={() => setCenterReportOpen(false)}><X size={16} /></button></header><div className="center-report-body"><div className="completion-banner"><Check size={18} /><div><strong>الطالب أنهى الساعات المقررة</strong><small>تم الوصول إلى الحد الشهري الكامل.</small></div></div><label className="full-field">رسالة التقرير<textarea readOnly rows={9} value={centerReportText} /></label></div><footer className="detail-footer"><button type="button" className="secondary-button" onClick={() => setCenterReportOpen(false)}>إغلاق</button><button type="button" className="primary-button" onClick={copyCenterReport}><FileText size={15} /> نسخ التقرير وإرساله للمركز</button></footer></section></div> : null}
</main>
  );
}
