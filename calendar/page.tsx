"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ListFilter, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import "./calendar.css";

type ViewMode = "month" | "week" | "day";
type Appointment = {
  id: number;
  date: string;
  time: string;
  end: string;
  student: string;
  country: string;
  timezone: string;
  subject: string;
  duration: number;
  status: string;
};

type FormState = Omit<Appointment, "id" | "end">;

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const countryOptions = [
  { label: "🇧🇪 بلجيكا", timezone: "Europe/Brussels" },
  { label: "🇫🇷 فرنسا", timezone: "Europe/Paris" },
];
const initialAppointments: Appointment[] = [
  { id: 1, date: "2026-09-06", time: "09:00", end: "09:45", student: "هارون", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 2, date: "2026-09-06", time: "14:00", end: "15:00", student: "ريان", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "العربية", duration: 60, status: "مؤكد" },
  { id: 3, date: "2026-09-06", time: "18:00", end: "18:45", student: "فاضل", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 4, date: "2026-09-07", time: "10:00", end: "10:45", student: "ماهر", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "العربية", duration: 45, status: "مؤكد" },
  { id: 5, date: "2026-09-07", time: "18:30", end: "19:30", student: "هارون", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 60, status: "مؤكد" },
  { id: 6, date: "2026-09-08", time: "09:00", end: "09:45", student: "ريان", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 7, date: "2026-09-08", time: "16:00", end: "16:45", student: "فاضل", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 8, date: "2026-09-08", time: "19:00", end: "19:45", student: "ماهر", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "العربية", duration: 45, status: "مؤكد" },
  { id: 9, date: "2026-09-09", time: "14:00", end: "15:00", student: "هارون", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 60, status: "مؤكد" },
  { id: 10, date: "2026-09-09", time: "18:00", end: "18:45", student: "ريان", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "العربية", duration: 45, status: "مؤكد" },
  { id: 11, date: "2026-09-10", time: "10:00", end: "10:45", student: "فاضل", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 12, date: "2026-09-10", time: "16:00", end: "17:00", student: "ماهر", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "العربية", duration: 60, status: "مؤكد" },
  { id: 13, date: "2026-09-10", time: "19:00", end: "19:45", student: "هارون", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 14, date: "2026-09-12", time: "11:00", end: "11:45", student: "ريان", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 45, status: "مؤكد" },
  { id: 15, date: "2026-09-12", time: "18:00", end: "19:00", student: "فاضل", country: "🇫🇷 فرنسا", timezone: "Europe/Paris", subject: "القرآن الكريم", duration: 60, status: "مؤكد" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (date: Date, amount: number) => { const d = new Date(date); d.setDate(d.getDate() + amount); return d; };
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const endTime = (time: string, duration: number) => { const total = minutes(time) + duration; return `${pad(Math.floor((total % 1440) / 60))}:${pad(total % 60)}`; };
const formatArabicDate = (date: Date) => new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
const monthTitle = (date: Date) => new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(date);

function localTime(date: string, time: string, timezone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(y, m - 1, d, h, min));
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(utcGuess);
  const hour = parts.find(p => p.type === "hour")?.value ?? "00";
  const minute = parts.find(p => p.type === "minute")?.value ?? "00";
  const cairoParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(utcGuess);
  const cairoHour = Number(cairoParts.find(p => p.type === "hour")?.value ?? h);
  const cairoMinute = Number(cairoParts.find(p => p.type === "minute")?.value ?? min);
  const cairoTotal = cairoHour * 60 + cairoMinute;
  const targetTotal = Number(hour) * 60 + Number(minute);
  let delta = targetTotal - cairoTotal;
  if (delta > 720) delta -= 1440;
  if (delta < -720) delta += 1440;
  const total = (minutes(time) + delta + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function weekStart(date: Date) { return addDays(date, -date.getDay()); }

const emptyForm = (date: string): FormState => ({ date, time: "18:00", student: "", country: "🇧🇪 بلجيكا", timezone: "Europe/Brussels", subject: "القرآن الكريم", duration: 45, status: "مؤكد" });

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState("2026-09-06");
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedCountry, setSelectedCountry] = useState("🇧🇪 بلجيكا");
  const [converterTime, setConverterTime] = useState("18:00");
  const [filter, setFilter] = useState("الكل");
  const [modalOpen, setModalOpen] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedDate));

  const selected = new Date(`${selectedDate}T12:00:00`);
  const week = weekStart(selected);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const visibleAppointments = useMemo(() => filter === "الكل" ? appointments : appointments.filter(a => a.subject === filter), [appointments, filter]);
  const weekAppointments = visibleAppointments.filter(a => a.date >= dateKey(weekDates[0]) && a.date <= dateKey(weekDates[6]));
  const totalHours = weekAppointments.reduce((sum, a) => sum + a.duration, 0) / 60;
  const dayAppointments = visibleAppointments.filter(a => a.date === selectedDate).sort((a, b) => minutes(a.time) - minutes(b.time));
  const conflicts = useMemo(() => appointments.flatMap((a, i) => appointments.slice(i + 1).filter(b => a.date === b.date && minutes(a.time) < minutes(b.end) && minutes(b.time) < minutes(a.end)).map(b => [a.id, b.id] as const)), [appointments]);
  const conflictIds = new Set(conflicts.flat());

  const openAdd = (date = selectedDate, time = "18:00") => { setEditingId(null); setForm({ ...emptyForm(date), time }); setModalOpen(true); setMenuId(null); };
  const openEdit = (a: Appointment) => { setEditingId(a.id); setForm({ date: a.date, time: a.time, student: a.student, country: a.country, timezone: a.timezone, subject: a.subject, duration: a.duration, status: a.status }); setModalOpen(true); setMenuId(null); };
  const saveAppointment = () => {
    if (!form.student.trim()) return;
    const next: Appointment = { ...form, id: editingId ?? Math.max(0, ...appointments.map(a => a.id)) + 1, end: endTime(form.time, form.duration) };
    const overlap = appointments.some(a => a.id !== next.id && a.date === next.date && minutes(next.time) < minutes(a.end) && minutes(a.time) < minutes(next.end));
    if (overlap && !window.confirm("هذا الموعد يتداخل مع موعد آخر. هل تريد الحفظ رغم ذلك؟")) return;
    setAppointments(prev => editingId ? prev.map(a => a.id === editingId ? next : a) : [...prev, next]);
    setSelectedDate(next.date); setModalOpen(false);
  };
  const deleteAppointment = (id: number) => { if (window.confirm("هل تريد حذف هذا الموعد؟")) setAppointments(prev => prev.filter(a => a.id !== id)); setMenuId(null); };
  const navigate = (direction: number) => setSelectedDate(dateKey(view === "month" ? new Date(selected.getFullYear(), selected.getMonth() + direction, 1) : addDays(selected, view === "week" ? direction * 7 : direction)));
  const goToday = () => setSelectedDate("2026-09-05");

  const calendarCells = useMemo(() => {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const count = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let i = 1; i <= count; i++) cells.push(new Date(selected.getFullYear(), selected.getMonth(), i));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [selected]);

  return <main className="calendar-shell" dir="rtl">
    <header className="calendar-header">
      <div><span className="calendar-eyebrow">إدارة المواعيد</span><h1>التقويم والمواعيد</h1><p>نظرة واضحة على جدول الحلقات مع التوقيت المحلي لكل طالب.</p></div>
      <button className="add-appointment" onClick={() => openAdd()}><Plus size={18}/> إضافة موعد</button>
    </header>

    <section className="timezone-card">
      <div className="timezone-title"><span className="timezone-icon"><ArrowLeftRight size={18}/></span><div><h2>محول فروق التوقيت المباشر</h2><p>حوّل الموعد فورياً بين توقيتك في مصر وتوقيت الطالب مع مراعاة التوقيت الصيفي.</p></div></div>
      <div className="timezone-controls">
        <label>الطالب / البلد<select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>{countryOptions.map(c => <option key={c.label}>{c.label}</option>)}</select></label>
        <label>توقيت مصر<input type="time" value={converterTime} onChange={e => setConverterTime(e.target.value)}/></label>
        <div className="timezone-result"><span>التوقيت المحلي للطالب</span><strong>{localTime(selectedDate, converterTime, countryOptions.find(c => c.label === selectedCountry)?.timezone ?? "Europe/Brussels")}</strong><small>{selectedCountry} · فرق التوقيت محسوب تلقائياً</small></div>
      </div>
    </section>

    {conflicts.length > 0 && <button className="conflict-alert" onClick={() => setView("day")}><span><AlertTriangle size={19}/></span><div><strong>تم اكتشاف {conflicts.length} تعارض في جدول المواعيد!</strong><small>راجع المواعيد المتداخلة قبل اعتماد الجدول.</small></div><ChevronLeft size={18}/></button>}

    <section className="calendar-toolbar">
      <div className="view-switch"><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>الشهر</button><button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>الأسبوع</button><button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>اليوم</button></div>
      <div className="date-nav"><button onClick={() => navigate(1)} aria-label="التالي"><ChevronRight size={17}/></button><strong>{view === "month" ? monthTitle(selected) : view === "day" ? formatArabicDate(selected) : `${formatArabicDate(weekDates[0])} - ${new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long" }).format(weekDates[6])}`}</strong><button onClick={() => navigate(-1)} aria-label="السابق"><ChevronLeft size={17}/></button><button className="today-button" onClick={goToday}>اليوم</button></div>
      <label className="filter-button"><ListFilter size={17}/> <select value={filter} onChange={e => setFilter(e.target.value)}><option>الكل</option><option>القرآن الكريم</option><option>العربية</option></select></label>
    </section>

    {view === "month" && <section className="month-calendar"><div className="month-weekdays">{days.map(d => <span key={d}>{d}</span>)}</div><div className="month-grid">{calendarCells.map((date, i) => { const key = date && dateKey(date); const items = key ? visibleAppointments.filter(a => a.date === key).slice(0, 3) : []; return date ? <button className={`month-day ${key === "2026-09-05" ? "current" : ""}`} key={key} onClick={() => { setSelectedDate(key!); setView("day"); }}>{<b>{date.getDate()}</b>}{items.map(a => <span key={a.id} className={conflictIds.has(a.id) ? "has-conflict" : ""}><i/>{a.time} · {a.student}</span>)}{items.length > 0 && <small>{visibleAppointments.filter(a => a.date === key).length} موعد</small>}</button> : <div className="month-empty" key={`empty-${i}`}/>; })}</div></section>}

    {view !== "month" && <>
      <section className="week-summary"><div><span>المواعيد الأسبوعية</span><strong>{weekAppointments.length} <em>موعدًا</em></strong></div><div><span>إجمالي الساعات</span><strong>{totalHours.toFixed(1)} <em>ساعة</em></strong></div><div className="summary-days">{days.map((d, i) => { const key = dateKey(weekDates[i]); return <button key={d} onClick={() => setSelectedDate(key)} className={selectedDate === key ? "selected" : ""}><b>{visibleAppointments.filter(a => a.date === key).length}</b><span>{d}</span></button>; })}</div></section>
      {view === "week" && <section className="week-grid">{weekDates.map((date, i) => { const key = dateKey(date); const items = visibleAppointments.filter(a => a.date === key).sort((a, b) => minutes(a.time) - minutes(b.time)); return <div className={`day-column ${selectedDate === key ? "selected" : ""}`} key={key}><button className="day-heading" onClick={() => { setSelectedDate(key); setView("day"); }}><span>{days[i]} <small>{date.getDate()}</small></span><strong>{items.length}</strong></button><div className="day-list">{items.map(a => <article className={`appointment-card ${conflictIds.has(a.id) ? "appointment-conflict" : ""}`} key={a.id}><div className="appointment-time"><strong>{a.time}</strong><span>{localTime(a.date, a.time, a.timezone)} محلي</span></div><div className="appointment-main"><h3>{a.student}</h3><p>{a.subject}</p><small>{a.country} · {a.duration} دقيقة</small></div><button className="more" onClick={() => setMenuId(menuId === a.id ? null : a.id)}><MoreHorizontal size={17}/></button>{menuId === a.id && <div className="appointment-menu"><button onClick={() => openEdit(a)}>تعديل</button><button onClick={() => deleteAppointment(a.id)}>حذف</button></div>}</article>)}</div><button className="column-add" onClick={() => openAdd(key)}><Plus size={15}/> إضافة</button></div>; })}</section>}
      {view === "day" && <section className="day-view"><div className="day-view-head"><div><span>الجدول اليومي</span><h2>{formatArabicDate(selected)}</h2></div><span className="day-count">{dayAppointments.length} مواعيد</span></div>{dayAppointments.length ? dayAppointments.map(a => <article className={`detail-appointment ${conflictIds.has(a.id) ? "appointment-conflict" : ""}`} key={a.id}><div className="detail-time"><strong>{a.time}</strong><span>{a.end}</span></div><div className="detail-line"/><div className="detail-info"><h3>{a.student}</h3><p>{a.subject} · {a.country}</p><span><Clock3 size={14}/> توقيت الطالب: {localTime(a.date, a.time, a.timezone)}</span></div><span className="status">{a.status}</span><button className="more" onClick={() => setMenuId(menuId === a.id ? null : a.id)}><MoreHorizontal size={18}/></button>{menuId === a.id && <div className="appointment-menu"><button onClick={() => openEdit(a)}>تعديل</button><button onClick={() => deleteAppointment(a.id)}>حذف</button></div>}</article>) : <div className="empty-day">لا توجد مواعيد في هذا اليوم.<button className="add-inline" onClick={() => openAdd()}>إضافة موعد</button></div>}</section>}
    </>}

    <footer className="calendar-footer"><span><Clock3 size={15}/> جميع الأوقات الأساسية معروضة بتوقيت مصر (Africa/Cairo)</span><span><CalendarDays size={15}/> التحديثات محلية حالياً وسيتم ربطها بقاعدة البيانات في المرحلة التالية</span></footer>

    {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}><section className="appointment-modal" dir="rtl"><header><div><span>إدارة الموعد</span><h2>{editingId ? "تعديل الموعد" : "إضافة موعد جديد"}</h2></div><button onClick={() => setModalOpen(false)}><X size={19}/></button></header><div className="modal-grid"><label>اسم الطالب<input value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} placeholder="مثال: هارون"/></label><label>البلد<select value={form.country} onChange={e => { const c = countryOptions.find(x => x.label === e.target.value)!; setForm({ ...form, country: c.label, timezone: c.timezone }); }}>{countryOptions.map(c => <option key={c.label}>{c.label}</option>)}</select></label><label>التاريخ<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label><label>الوقت بتوقيت مصر<input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}/></label><label>المدة<select value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })}><option value={30}>30 دقيقة</option><option value={45}>45 دقيقة</option><option value={60}>60 دقيقة</option><option value={90}>90 دقيقة</option></select></label><label>المادة<select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}><option>القرآن الكريم</option><option>العربية</option><option>الدراسات الإسلامية</option></select></label><label>الحالة<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>مؤكد</option><option>في الانتظار</option><option>ملغي</option></select></label></div><div className="modal-preview"><span>توقيت الطالب المتوقع</span><strong>{localTime(form.date, form.time, form.timezone)}</strong><small>{form.country} · نهاية الموعد {endTime(form.time, form.duration)} بتوقيت مصر</small></div><footer><button className="cancel" onClick={() => setModalOpen(false)}>إلغاء</button><button className="save" onClick={saveAppointment}><Check size={17}/> حفظ الموعد</button></footer></section></div>}
  </main>;
}
