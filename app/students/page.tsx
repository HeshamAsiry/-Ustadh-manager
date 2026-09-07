"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Archive, BookOpenCheck, CalendarDays, Check, ChevronLeft, Clock3, FileText, Globe2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, UserRound, Users, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./students.css";

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
  monthly_hours: number;
  status: "active" | "paused" | "archived";
  notes: string | null;
  created_at: string;
};

type Subject = { id: string; name_ar: string; name_fr: string | null; name_en: string | null };
type DetailLesson = { starts_at: string; ends_at: string; title: string; status: string; is_makeup: boolean; notes: string | null; report?: { taught_text: string | null; review_text: string | null; homework_text: string | null } | null };

type FormState = {
  full_name: string;
  age: string;
  country_code: string;
  timezone: string;
  native_language: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  monthly_hours: string;
  status: "active" | "paused" | "archived";
  notes: string;
  subject_ids: string[];
};

const EMPTY_FORM: FormState = {
  full_name: "", age: "", country_code: "BE", timezone: "Europe/Brussels", native_language: "",
  contact_name: "", contact_email: "", contact_phone: "", monthly_hours: "8", status: "active", notes: "", subject_ids: [],
};

const COUNTRIES = [
  ["BE", "بلجيكا", "Europe/Brussels"], ["FR", "فرنسا", "Europe/Paris"], ["NL", "هولندا", "Europe/Amsterdam"],
  ["DE", "ألمانيا", "Europe/Berlin"], ["GB", "المملكة المتحدة", "Europe/London"], ["CA", "كندا", "America/Toronto"],
  ["AE", "الإمارات", "Asia/Dubai"], ["SA", "السعودية", "Asia/Riyadh"], ["EG", "مصر", "Africa/Cairo"],
];

const statusLabel: Record<Student["status"], string> = { active: "نشط", paused: "متوقف مؤقتًا", archived: "مؤرشف" };

const initials = (name: string) => name.trim().slice(0, 2) || "ط";
const formatDate = (value: string) => new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const formatTime = (value: string) => new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const minutesBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Student["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "lessons" | "statement">("overview");
  const [detailLessons, setDetailLessons] = useState<DetailLesson[]>([]);
  const [detailSubjects, setDetailSubjects] = useState<Subject[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (!error) setStudents((data ?? []) as Student[]);
    else setMessage(error.message);
    setLoading(false);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id,name_ar,name_fr,name_en").eq("is_active", true).order("sort_order", { ascending: true });
    setSubjects((data ?? []) as Subject[]);
  };

  useEffect(() => { void loadStudents(); void loadSubjects(); }, []);

  const filteredStudents = useMemo(() => students.filter((student) => {
    const matchesQuery = `${student.full_name} ${student.contact_name ?? ""} ${student.contact_email ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "all" || student.status === statusFilter);
  }), [students, query, statusFilter]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    paused: students.filter((s) => s.status === "paused").length,
    hours: students.reduce((sum, s) => sum + Number(s.monthly_hours || 0), 0),
  }), [students]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setMessage(""); setFormOpen(true); };

  const openEdit = async (student: Student) => {
    const { data } = await supabase.from("student_subjects").select("subject_id").eq("student_id", student.id);
    setEditingId(student.id);
    setForm({
      full_name: student.full_name, age: student.age?.toString() ?? "", country_code: student.country_code ?? "", timezone: student.timezone,
      native_language: student.native_language ?? "", contact_name: student.contact_name ?? "", contact_email: student.contact_email ?? "", contact_phone: student.contact_phone ?? "",
      monthly_hours: String(student.monthly_hours ?? 0), status: student.status, notes: student.notes ?? "", subject_ids: (data ?? []).map((row) => row.subject_id),
    });
    setMessage(""); setFormOpen(true);
  };

  const saveStudent = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setMessage("انتهت جلسة الدخول. أعد تحميل الصفحة ثم حاول مرة أخرى."); setSaving(false); return; }

    const payload = {
      full_name: form.full_name.trim(), age: form.age ? Number(form.age) : null, country_code: form.country_code || null, timezone: form.timezone || "Europe/Paris",
      native_language: form.native_language.trim() || null, contact_name: form.contact_name.trim() || null, contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null, monthly_hours: Number(form.monthly_hours || 0), status: form.status, notes: form.notes.trim() || null,
      teacher_id: userData.user.id,
    };

    let studentId = editingId;
    if (editingId) {
      const { error } = await supabase.from("students").update(payload).eq("id", editingId);
      if (error) { setMessage(error.message); setSaving(false); return; }
      await supabase.from("student_subjects").delete().eq("student_id", editingId);
    } else {
      const { data, error } = await supabase.from("students").insert(payload).select("id").single();
      if (error || !data) { setMessage(error?.message ?? "تعذر حفظ الطالب."); setSaving(false); return; }
      studentId = data.id;
    }

    if (studentId && form.subject_ids.length) {
      const rows = form.subject_ids.map((subject_id) => ({ student_id: studentId, subject_id }));
      const { error } = await supabase.from("student_subjects").insert(rows);
      if (error) { setMessage(error.message); setSaving(false); return; }
    }

    await loadStudents();
    setFormOpen(false); setSaving(false); setMessage(editingId ? "تم تحديث بيانات الطالب." : "تمت إضافة الطالب بنجاح.");
  };

  const archiveStudent = async (student: Student) => {
    const nextStatus = student.status === "archived" ? "active" : "archived";
    const { error } = await supabase.from("students").update({ status: nextStatus }).eq("id", student.id);
    if (!error) { await loadStudents(); setSelected(null); setMessage(nextStatus === "archived" ? "تم أرشفة الطالب." : "تمت إعادة تفعيل الطالب."); }
    else setMessage(error.message);
  };

  const openDetails = async (student: Student) => {
    setSelected(student); setDetailTab("overview"); setDetailLessons([]); setDetailSubjects([]); setDetailLoading(true);
    const [eventsResult, subjectsResult] = await Promise.all([
      supabase.from("events").select("starts_at,ends_at,title,status,is_makeup,notes,lesson_reports(taught_text,review_text,homework_text)").eq("student_id", student.id).order("starts_at", { ascending: false }).limit(50),
      supabase.from("student_subjects").select("subjects(id,name_ar,name_fr,name_en)").eq("student_id", student.id),
    ]);
    const lessons = (eventsResult.data ?? []).map((row: any) => ({ ...row, report: Array.isArray(row.lesson_reports) ? (row.lesson_reports[0] ?? null) : row.lesson_reports ?? null }));
    setDetailLessons(lessons);
    setDetailSubjects((subjectsResult.data ?? []).map((row: any) => row.subjects).filter(Boolean));
    setDetailLoading(false);
  };

  const completedLessons = detailLessons.filter((lesson) => lesson.status === "completed");
  const totalMinutes = detailLessons.reduce((sum, lesson) => sum + minutesBetween(lesson.starts_at, lesson.ends_at), 0);

  return (
    <main className="students-page" dir="rtl">
      <header className="students-topbar">
        <div><p className="eyebrow">إدارة الطلاب</p><h1>الطلاب</h1><p className="subtitle">ملفات الطلاب، المواد، الساعات والتقدم في مكان واحد.</p></div>
        <button className="primary-button" onClick={openCreate}><Plus size={17} /> إضافة طالب جديد</button>
      </header>

      {message && <div className="toast"><Check size={16} />{message}<button onClick={() => setMessage("")} aria-label="إغلاق"><X size={15} /></button></div>}

      <section className="students-stats">
        <div><span className="stat-icon"><Users size={18} /></span><div><strong>{stats.total}</strong><small>إجمالي الطلاب</small></div></div>
        <div><span className="stat-icon"><Check size={18} /></span><div><strong>{stats.active}</strong><small>طلاب نشطون</small></div></div>
        <div><span className="stat-icon"><Clock3 size={18} /></span><div><strong>{stats.hours.toFixed(1)}</strong><small>ساعات مقررة / شهر</small></div></div>
        <div><span className="stat-icon"><Archive size={18} /></span><div><strong>{stats.paused}</strong><small>متوقفون مؤقتًا</small></div></div>
      </section>

      <section className="students-panel">
        <div className="panel-head"><div><span className="section-index">01</span><div><h2>قائمة الطلاب</h2><p>{filteredStudents.length} طالب مطابق للبحث الحالي</p></div></div><div className="panel-tools"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم الطالب أو ولي الأمر..." /></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}><option value="all">كل الحالات</option><option value="active">نشط</option><option value="paused">متوقف مؤقتًا</option><option value="archived">مؤرشف</option></select></div></div>

        {loading ? <div className="empty-state"><div className="loading-mark">ر</div><p>جارٍ تحميل الطلاب...</p></div> : filteredStudents.length === 0 ? <div className="empty-state"><Users size={30} /><h3>لا يوجد طلاب مطابقون</h3><p>أضف طالبًا جديدًا أو عدّل البحث.</p><button className="secondary-button" onClick={openCreate}><Plus size={16} /> إضافة طالب</button></div> : (
          <div className="student-list">
            {filteredStudents.map((student) => (
              <article className="student-row" key={student.id}>
                <div className="student-main"><div className="student-avatar">{initials(student.full_name)}</div><div><h3>{student.full_name}</h3><p>{student.age ? `${student.age} سنة` : "العمر غير محدد"} · {student.country_code ?? "الدولة غير محددة"}</p></div></div>
                <div className="student-cell subjects-cell"><span>المواد</span><strong>اضغط للتفاصيل</strong><div className="mini-subjects"><BookOpenCheck size={14} /><span>عرض ملف الطالب</span></div></div>
                <div className="student-cell"><span>الساعات الشهرية</span><strong>{Number(student.monthly_hours).toFixed(1)} ساعة</strong></div>
                <div className="student-cell"><span>المنطقة الزمنية</span><strong>{student.timezone.replace("Europe/", "")}</strong></div>
                <div className="student-status"><span className={`status-badge ${student.status}`}>{statusLabel[student.status]}</span><small>منذ {formatDate(student.created_at)}</small></div>
                <div className="student-actions"><button onClick={() => openDetails(student)} aria-label={`فتح ملف ${student.full_name}`}><ChevronLeft size={17} /></button><button onClick={() => openEdit(student)} aria-label={`تعديل ${student.full_name}`}><Pencil size={16} /></button></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="students-guide"><div><span className="guide-icon"><FileText size={19} /></span><div><strong>كشف الطالب قابل للطباعة والإرسال</strong><p>من ملف الطالب يمكنك إنشاء كشف متابعة بالدروس والساعات والإنجازات، بدون عرض أي مستحقات مالية.</p></div></div><span className="guide-note">مناسب للإرسال لولي الأمر</span></section>

      {formOpen && <div className="modal-backdrop"><section className="student-modal form-modal" role="dialog" aria-modal="true"><header><div><span className="section-index">{editingId ? "02" : "02"}</span><div><h2>{editingId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</h2><p>البيانات الأساسية التي يعتمد عليها الجدول والمتابعة.</p></div></div><button className="close-button" onClick={() => setFormOpen(false)} aria-label="إغلاق"><X size={18} /></button></header><form onSubmit={saveStudent}>
        <div className="form-grid">
          <label>اسم الطالب<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="مثال: هارون" /></label>
          <label>العمر<input type="number" min="1" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="12" /></label>
          <label>الدولة<select value={form.country_code} onChange={(e) => { const country = COUNTRIES.find((item) => item[0] === e.target.value); setForm({ ...form, country_code: e.target.value, timezone: country?.[2] ?? form.timezone }); }}>{COUNTRIES.map((country) => <option key={country[0]} value={country[0]}>{country[1]}</option>)}</select></label>
          <label>المنطقة الزمنية<input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></label>
          <label>اللغة الأم<input value={form.native_language} onChange={(e) => setForm({ ...form, native_language: e.target.value })} placeholder="فرنسية / هولندية..." /></label>
          <label>الساعات الشهرية<input type="number" min="0" step="0.5" value={form.monthly_hours} onChange={(e) => setForm({ ...form, monthly_hours: e.target.value })} /></label>
          <label>اسم ولي الأمر<input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></label>
          <label>هاتف ولي الأمر<input dir="ltr" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></label>
          <label>بريد ولي الأمر<input dir="ltr" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></label>
          <label>الحالة<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}><option value="active">نشط</option><option value="paused">متوقف مؤقتًا</option><option value="archived">مؤرشف</option></select></label>
        </div>
        <div className="form-section"><div><h3>المواد الدراسية</h3><p>يمكن اختيار أكثر من مادة للطالب.</p></div><div className="subject-picker">{subjects.map((subject) => <button key={subject.id} type="button" className={form.subject_ids.includes(subject.id) ? "selected" : ""} onClick={() => setForm({ ...form, subject_ids: form.subject_ids.includes(subject.id) ? form.subject_ids.filter((id) => id !== subject.id) : [...form.subject_ids, subject.id] })}><span>{subject.name_ar}</span>{form.subject_ids.includes(subject.id) && <Check size={14} />}</button>)}</div></div>
        <label className="full-field">ملاحظات<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات عامة عن الطالب..." /></label>
        <footer><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>إلغاء</button><button className="primary-button" disabled={saving}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الطالب"}</button></footer>
      </form></section></div>}

      {selected && <div className="modal-backdrop"><section className="student-modal detail-modal" role="dialog" aria-modal="true"><header><div className="detail-heading"><div className="student-avatar large">{initials(selected.full_name)}</div><div><span className="status-badge active">{statusLabel[selected.status]}</span><h2>{selected.full_name}</h2><p>{selected.age ? `${selected.age} سنة` : "العمر غير محدد"} · {selected.country_code ?? "الدولة غير محددة"} · {selected.timezone}</p></div></div><button className="close-button" onClick={() => setSelected(null)} aria-label="إغلاق"><X size={18} /></button></header><div className="detail-tabs"><button className={detailTab === "overview" ? "active" : ""} onClick={() => setDetailTab("overview")}>نظرة عامة</button><button className={detailTab === "lessons" ? "active" : ""} onClick={() => setDetailTab("lessons")}>الحصص</button><button className={detailTab === "statement" ? "active" : ""} onClick={() => setDetailTab("statement")}>كشف المتابعة</button></div>
        {detailLoading ? <div className="empty-state compact"><div className="loading-mark">ر</div><p>جارٍ تحميل ملف الطالب...</p></div> : <>
          {detailTab === "overview" && <div className="detail-content"><div className="info-grid"><div><span><Clock3 size={15} /> الساعات الشهرية</span><strong>{Number(selected.monthly_hours).toFixed(1)} ساعة</strong></div><div><span><Globe2 size={15} /> المنطقة الزمنية</span><strong>{selected.timezone}</strong></div><div><span><MapPin size={15} /> الدولة</span><strong>{selected.country_code ?? "غير محددة"}</strong></div><div><span><UserRound size={15} /> اللغة الأم</span><strong>{selected.native_language ?? "غير محددة"}</strong></div></div><div className="detail-columns"><div className="detail-card"><div className="card-title"><h3>المواد الدراسية</h3><span>{detailSubjects.length}</span></div>{detailSubjects.length ? <div className="subject-chips">{detailSubjects.map((subject) => <span key={subject.id}><BookOpenCheck size={13} />{subject.name_ar}</span>)}</div> : <p className="muted">لم تُحدد مواد بعد.</p>}</div><div className="detail-card"><div className="card-title"><h3>بيانات ولي الأمر</h3></div><div className="contact-list">{selected.contact_name && <span><UserRound size={14} />{selected.contact_name}</span>}{selected.contact_email && <span dir="ltr"><Mail size={14} />{selected.contact_email}</span>}{selected.contact_phone && <span dir="ltr"><Phone size={14} />{selected.contact_phone}</span>}{!selected.contact_name && !selected.contact_email && !selected.contact_phone && <p className="muted">لا توجد بيانات اتصال.</p>}</div></div></div><div className="detail-card notes-card"><div className="card-title"><h3>ملاحظات المعلم</h3></div><p>{selected.notes || "لا توجد ملاحظات مسجلة."}</p></div></div>}
          {detailTab === "lessons" && <div className="detail-content"><div className="mini-stats"><div><strong>{detailLessons.length}</strong><span>إجمالي الحصص</span></div><div><strong>{completedLessons.length}</strong><span>مكتملة</span></div><div><strong>{(totalMinutes / 60).toFixed(1)}</strong><span>ساعة مسجلة</span></div></div><div className="lesson-list">{detailLessons.length ? detailLessons.map((lesson, index) => <div className="lesson-item" key={`${lesson.starts_at}-${index}`}><div className="lesson-time"><strong>{formatTime(lesson.starts_at)}</strong><span>{formatDate(lesson.starts_at)}</span></div><div className="lesson-body"><h3>{lesson.title}</h3><p>{lesson.report?.taught_text || lesson.notes || "لا يوجد وصف للحصة بعد."}</p></div><span className={`lesson-status ${lesson.status}`}>{lesson.status === "completed" ? "مكتملة" : lesson.is_makeup ? "تعويضية" : "مجدولة"}</span></div>) : <div className="empty-state compact"><CalendarDays size={28} /><p>لا توجد حصص مسجلة لهذا الطالب حتى الآن.</p></div>}</div></div>}
          {detailTab === "statement" && <div className="statement-wrap" id="print-statement"><div className="statement-head"><div><span>رواق · إدارة التعليم</span><h2>كشف متابعة الطالب</h2><p>هذا الكشف مخصص للمشاركة مع ولي الأمر ولا يتضمن أي بيانات مالية أو مستحقات.</p></div><button className="secondary-button no-print" onClick={() => window.print()}><FileText size={15} /> طباعة / PDF</button></div><div className="statement-student"><div><span>الطالب</span><strong>{selected.full_name}</strong></div><div><span>الساعات الشهرية</span><strong>{Number(selected.monthly_hours).toFixed(1)} ساعة</strong></div><div><span>الحصص المكتملة</span><strong>{completedLessons.length}</strong></div><div><span>الساعات المسجلة</span><strong>{(totalMinutes / 60).toFixed(1)} ساعة</strong></div></div><div className="statement-table"><div className="table-row table-head"><span>التاريخ</span><span>الحصة</span><span>المدة</span><span>الإنجاز / التقرير</span></div>{completedLessons.length ? completedLessons.slice(0, 20).map((lesson, index) => <div className="table-row" key={`${lesson.starts_at}-${index}`}><span>{formatDate(lesson.starts_at)}</span><span>{lesson.title}</span><span>{minutesBetween(lesson.starts_at, lesson.ends_at)} د</span><span>{lesson.report?.taught_text || lesson.report?.review_text || "تمت الحصة بنجاح."}</span></div>) : <div className="statement-empty">لا توجد حصص مكتملة مسجلة حتى الآن.</div>}</div><div className="statement-footer">رواق · تقرير متابعة تعليمي — بدون مستحقات مالية</div></div>}
        </>}
        <footer className="detail-footer"><button className="danger-button" onClick={() => archiveStudent(selected)}>{selected.status === "archived" ? <Check size={15} /> : <Trash2 size={15} />}{selected.status === "archived" ? "إعادة تفعيل" : "أرشفة الطالب"}</button><div><button className="secondary-button" onClick={() => openEdit(selected)}><Pencil size={15} /> تعديل البيانات</button><button className="primary-button" onClick={() => setDetailTab("statement")}><FileText size={15} /> فتح كشف المتابعة</button></div></footer>
      </section></div>}
    </main>
  );
}
