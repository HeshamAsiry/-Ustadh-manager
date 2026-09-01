"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, X } from "lucide-react";
import AppShell from "../../components/app-shell";
import RiwaqWeeklyTimetable, { RiwaqEvent, RiwaqStudent } from "../../components/riwaq-weekly-timetable";
import { createEvent, deleteEvent, getEvents, getProfile, getStudents, hasEventConflict, updateEvent } from "../../lib/data";
import { formatTimeInZone, zonedDateTimeToUtc } from "../../lib/timezone";
import { cancelRecurringSchedule, createRecurringSchedule, syncRecurringSchedules, updateRecurringSchedule } from "../../lib/recurring";

type Student = RiwaqStudent & { phone?: string | null; country_code?: string | null };
type Event = RiwaqEvent & { event_type?: string; notes?: string | null; original_event_id?: string | null };

const DAYS = [[0, "الأحد"], [1, "الاثنين"], [2, "الثلاثاء"], [3, "الأربعاء"], [4, "الخميس"], [5, "الجمعة"], [6, "السبت"]] as const;
const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const duration = (e: Event) => Math.max(1, Math.round((new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000));

function datePartsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return { year: Number(parts.find((p) => p.type === "year")?.value), month: Number(parts.find((p) => p.type === "month")?.value), day: Number(parts.find((p) => p.type === "day")?.value) };
}

function weekRange(timeZone: string) {
  const now = new Date();
  const { year, month, day } = datePartsInZone(now, timeZone);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0);
  localNoon.setDate(localNoon.getDate() - localNoon.getDay());
  const fromDate = `${localNoon.getFullYear()}-${String(localNoon.getMonth() + 1).padStart(2, "0")}-${String(localNoon.getDate()).padStart(2, "0")}`;
  const toLocal = new Date(localNoon);
  toLocal.setDate(toLocal.getDate() + 7);
  const toDate = `${toLocal.getFullYear()}-${String(toLocal.getMonth() + 1).padStart(2, "0")}-${String(toLocal.getDate()).padStart(2, "0")}`;
  return { from: zonedDateTimeToUtc(fromDate, "00:00", timeZone), to: zonedDateTimeToUtc(toDate, "00:00", timeZone) };
}

export default function RiwaqCalendarPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [teacherZone, setTeacherZone] = useState(localZone());
  const [teacherCountry, setTeacherCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const profileResult = await getProfile();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const profile = profileResult.data as any;
      const zone = profile?.timezone || localZone();
      setTeacherZone(zone);
      setTeacherCountry(profile?.country || profile?.country_code || "");
      const sync = await syncRecurringSchedules(90);
      if (sync.error) throw new Error(sync.error.message);
      const { from, to } = weekRange(zone);
      const [studentResult, eventResult] = await Promise.all([getStudents("active"), getEvents(from.toISOString(), to.toISOString())]);
      if (studentResult.error) throw new Error(studentResult.error.message);
      if (eventResult.error) throw new Error(eventResult.error.message);
      setStudents((studentResult.data || []) as Student[]);
      setEvents((eventResult.data || []) as Event[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل التقويم");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const action = new URLSearchParams(window.location.search).get("action"); if (action === "new") setModalOpen(true); }, []);

  const timetableEvents = useMemo(() => events.filter((event) => event.student_id || event.title), [events]);
  const openAdd = () => { setEditing(null); setError(""); setModalOpen(true); };
  const openEdit = (event: RiwaqEvent) => { setEditing(event as Event); setError(""); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  async function remove(event: RiwaqEvent) {
    const e = event as Event;
    if (!confirm(e.recurring_schedule_id ? "حذف هذه الحصة فقط؟ سيستمر الموعد الأسبوعي." : "حذف هذا الموعد؟")) return;
    const result = await deleteEvent(e.id);
    if (result.error) setError(result.error.message); else await load();
  }

  async function complete(event: RiwaqEvent) {
    const e = event as Event;
    const result = await updateEvent(e.id, { status: e.status === "completed" ? "scheduled" : "completed" });
    if (result.error) setError(result.error.message); else await load();
  }

  function whatsapp(event: RiwaqEvent, student: RiwaqStudent) {
    const s = student as Student;
    if (!s.phone) { alert("لا يوجد رقم واتساب مسجل لهذا الطالب."); return; }
    const phone = s.phone.replace(/[^0-9]/g, "");
    const time = formatTimeInZone(event.starts_at, teacherZone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`السلام عليكم ${s.full_name}، تذكير بموعد الدرس اليوم الساعة ${time}.`)}`, "_blank", "noopener,noreferrer");
  }

  return <AppShell><div style={{ display: "grid", gap: 14 }}>{error && <p className="login-error">{error}</p>}{loading ? <div className="empty card"><h2>جاري تحميل جدول رِواق…</h2></div> : <RiwaqWeeklyTimetable events={timetableEvents} students={students} teacherTimeZone={teacherZone} teacherCountry={teacherCountry} onAdd={openAdd} onEdit={openEdit} onDelete={remove} onComplete={complete} onWhatsApp={whatsapp} />}</div>{modalOpen && <RiwaqEventModal students={students} event={editing} teacherTimeZone={teacherZone} onClose={closeModal} onSaved={async () => { closeModal(); await load(); }} setError={setError} />}</AppShell>;
}

function RiwaqEventModal({ students, event, teacherTimeZone, onClose, onSaved, setError }: { students: Student[]; event: Event | null; teacherTimeZone: string; onClose: () => void; onSaved: () => Promise<void>; setError: (value: string) => void; }) {
  const student0 = students.find((s) => s.id === event?.student_id);
  const zone = event?.timezone || student0?.timezone || teacherTimeZone;
  const initialDate = event ? new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date(event.starts_at)) : dateKey(new Date());
  const initialWeekday = event ? new Date(`${initialDate}T12:00:00`).getDay() : new Date().getDay();
  const [studentId, setStudentId] = useState(event?.student_id || "");
  const [title, setTitle] = useState(event?.title || "درس قرآن");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(event ? formatTimeInZone(event.starts_at, zone, "en-GB") : "18:00");
  const [durationMinutes, setDurationMinutes] = useState(event ? String(duration(event)) : "60");
  const [repeat, setRepeat] = useState(Boolean(event?.recurring_schedule_id));
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([initialWeekday]);
  const [status, setStatus] = useState(event?.status || "scheduled");
  const [notes, setNotes] = useState(event?.notes || "");
  const [saving, setSaving] = useState(false);
  const student = students.find((s) => s.id === studentId);
  const tz = student?.timezone || zone;
  const localTime = student ? formatTimeInZone(zonedDateTimeToUtc(date, time, tz), teacherTimeZone) : time;

  const toggleDay = (day: number) => setSelectedWeekdays((current) => current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const mins = Math.max(15, Number(durationMinutes) || 60);
      if (repeat && selectedWeekdays.length === 0) throw new Error("اختر يومًا واحدًا على الأقل للتكرار الأسبوعي.");
      const start = zonedDateTimeToUtc(date, time, tz);
      const end = new Date(start.getTime() + mins * 60000);
      const payload = { student_id: studentId || null, event_type: studentId ? (event?.is_makeup ? "makeup" : "lesson") : "personal", title: title.trim() || "موعد شخصي", timezone: tz, status, is_makeup: event?.is_makeup || false, original_event_id: event?.original_event_id || null, reminder_minutes: 30, notes: notes.trim() || null, starts_at: start.toISOString(), ends_at: end.toISOString() };

      if (event) {
        if (event.recurring_schedule_id && repeat) {
          const day = selectedWeekdays[0] ?? initialWeekday;
          const result = await updateRecurringSchedule(event.recurring_schedule_id, { student_id: studentId || null, title: payload.title, weekday: day, start_time: time, duration_minutes: mins, timezone: tz, notes: payload.notes });
          if (result.error) throw new Error(result.error.message);
          for (const extraDay of selectedWeekdays.slice(1)) {
            const created = await createRecurringSchedule({ student_id: studentId || null, title: payload.title, weekday: extraDay, start_time: time, duration_minutes: mins, timezone: tz, starts_on: date, notes: payload.notes });
            if (created.error) throw new Error(created.error.message);
          }
        } else if (event.recurring_schedule_id && !repeat) {
          const result = await cancelRecurringSchedule(event.recurring_schedule_id);
          if (result.error) throw new Error(result.error.message);
        } else if (!event.recurring_schedule_id && repeat) {
          for (const day of selectedWeekdays) {
            const result = await createRecurringSchedule({ student_id: studentId || null, title: payload.title, weekday: day, start_time: time, duration_minutes: mins, timezone: tz, starts_on: date, notes: payload.notes });
            if (result.error) throw new Error(result.error.message);
          }
        } else {
          const conflict = await hasEventConflict(start.toISOString(), end.toISOString(), event.id);
          if (conflict.error) throw new Error(conflict.error.message);
          if (conflict.conflict) throw new Error("يوجد تعارض في هذا الموعد.");
        }
        const result = await updateEvent(event.id, payload);
        if (result.error) throw new Error(result.error.message);
      } else if (repeat) {
        for (const day of selectedWeekdays) {
          const result = await createRecurringSchedule({ student_id: studentId || null, title: payload.title, weekday: day, start_time: time, duration_minutes: mins, timezone: tz, starts_on: date, notes: payload.notes });
          if (result.error) throw new Error(result.error.message);
        }
        const sync = await syncRecurringSchedules(90);
        if (sync.error) throw new Error(sync.error.message);
      } else {
        const conflict = await hasEventConflict(start.toISOString(), end.toISOString());
        if (conflict.error) throw new Error(conflict.error.message);
        if (conflict.conflict) throw new Error("يوجد تعارض في هذا الموعد.");
        const result = await createEvent(payload);
        if (result.error) throw new Error(result.error.message);
      }
      await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر حفظ الموعد"); }
    finally { setSaving(false); }
  }

  return <div className="overlay"><div className="modal" dir="rtl"><div className="modal-head"><div><p className="eyebrow">{event ? "تعديل الموعد" : "موعد جديد"}</p><h3>{event ? "تعديل الحصة" : "حجز درس"}</h3></div><button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button></div><form className="form" onSubmit={submit}>
    <div className="form-grid"><label className="field"><span>الطالب</span><select value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">موعد شخصي</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label><label className="field"><span>العنوان</span><input value={title} onChange={(e) => setTitle(e.target.value)} required /></label></div>
    <div className="repeat-box"><span className="field-label">نوع الموعد</span><label className="checkline"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> تكرار أسبوعي دائم</label><p className="hint">{repeat ? "اختر يومًا واحدًا أو أكثر، وسيتم إنشاء الحصص في كل الأيام المحددة." : "موعد لمرة واحدة."}</p>
      {repeat && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>{DAYS.map(([value, label]) => { const selected = selectedWeekdays.includes(value); return <button key={value} type="button" onClick={() => toggleDay(value)} aria-pressed={selected} style={{ border: "1px solid", borderColor: selected ? "#1f6f5b" : "#d7d7d7", background: selected ? "#1f6f5b" : "transparent", color: selected ? "#fff" : "inherit", borderRadius: 10, padding: "10px 8px", fontWeight: 700, cursor: "pointer", transition: "all .15s ease" }}>{label}</button>; })}</div>}
    </div>
    <div className="form-grid">{repeat ? <label className="field"><span>الأيام المختارة</span><div className="readonly-field"><span>{selectedWeekdays.length ? selectedWeekdays.map((d) => DAYS.find(([v]) => v === d)?.[1]).join("، ") : "لم يتم اختيار أيام"}</span></div></label> : <label className="field"><span>التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>}<label className="field"><span>الوقت بتوقيت الطالب</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></label></div>
    <div className="form-grid"><label className="field"><span>مدة الحصة بالدقائق</span><input type="number" min="15" step="15" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} /></label><label className="field"><span>الحالة</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="scheduled">مجدولة</option><option value="completed">مكتملة</option><option value="cancelled">ملغاة</option><option value="pending_makeup">تحتاج تعويض</option></select></label></div>
    <label className="field"><span>توقيت الطالب</span><div className="readonly-field"><Globe2 size={15} /><input value={tz} readOnly /></div></label><p className="hint">وقت المدرس المتوقع: <b>{localTime}</b></p><label className="field"><span>ملاحظات</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></label>
    <div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>إلغاء</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? "جارٍ الحفظ…" : event ? "حفظ التعديل" : "حجز الموعد"}</button></div>
  </form></div></div>;
}
