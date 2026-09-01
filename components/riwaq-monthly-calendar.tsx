"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import { getEvents } from "../lib/data";
import type { RiwaqEvent, RiwaqStudent } from "./riwaq-weekly-timetable";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const monthFormatter = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" });
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const zonedMidnight = (d: Date, timeZone: string) => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const y = Number(p.find(x => x.type === "year")?.value), m = Number(p.find(x => x.type === "month")?.value), day = Number(p.find(x => x.type === "day")?.value);
  return { y, m, day };
};
const localParts = (d: Date, timeZone: string) => zonedMidnight(d, timeZone);

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).format(new Date(value));
}

function monthGrid(cursor: Date, timeZone: string) {
  const { y, m } = localParts(cursor, timeZone);
  const first = new Date(y, m - 1, 1, 12);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

export default function RiwaqMonthlyCalendar({
  students, teacherTimeZone, studentFilter, onAdd, onEdit,
}: {
  students: RiwaqStudent[];
  teacherTimeZone: string;
  studentFilter: string;
  onAdd: () => void;
  onEdit: (event: RiwaqEvent) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<RiwaqEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const { y, m } = localParts(cursor, teacherTimeZone);
      const first = new Date(y, m - 1, 1, 12);
      const gridStart = new Date(first); gridStart.setDate(1 - first.getDay());
      const gridEnd = new Date(gridStart); gridEnd.setDate(gridStart.getDate() + 42);
      const from = new Date(gridStart); from.setHours(0, 0, 0, 0);
      const to = new Date(gridEnd); to.setHours(0, 0, 0, 0);
      const result = await getEvents(from.toISOString(), to.toISOString());
      if (result.error) throw new Error(result.error.message);
      setEvents((result.data || []) as RiwaqEvent[]);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل التقويم الشهري"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [cursor, teacherTimeZone]);

  const filtered = useMemo(() => events.filter(e => studentFilter === "all" || e.student_id === studentFilter), [events, studentFilter]);
  const grid = useMemo(() => monthGrid(cursor, teacherTimeZone), [cursor, teacherTimeZone]);
  const currentKey = dateKey(new Date());
  const { y: currentY, m: currentM } = localParts(cursor, teacherTimeZone);

  return <section className="riwaq-month-card" dir="rtl">
    <div className="riwaq-month-head">
      <div className="riwaq-month-nav">
        <button className="icon-btn" aria-label="الشهر السابق" onClick={() => setCursor(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}><ChevronRight size={18} /></button>
        <button className="month-title" onClick={() => setCursor(new Date())}>{monthFormatter.format(cursor)}</button>
        <button className="icon-btn" aria-label="الشهر التالي" onClick={() => setCursor(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}><ChevronLeft size={18} /></button>
      </div>
      <button className="primary-btn" onClick={onAdd}><Plus size={15} /> إضافة موعد</button>
    </div>
    {error && <p className="login-error">{error}</p>}
    <div className="riwaq-month-grid">
      {DAYS.map(day => <div className="riwaq-month-weekday" key={day}>{day}</div>)}
      {grid.map(day => {
        const key = dateKey(day);
        const p = localParts(day, teacherTimeZone);
        const inMonth = p.y === currentY && p.m === currentM;
        const dayEvents = filtered.filter(e => dateKey(new Date(e.starts_at)) === key).sort((a,b) => +new Date(a.starts_at) - +new Date(b.starts_at));
        return <div className={`riwaq-month-day ${inMonth ? "" : "muted-day"} ${key === currentKey ? "today" : ""}`} key={key}>
          <div className="riwaq-month-day-number">{day.getDate()}</div>
          <div className="riwaq-month-events">
            {dayEvents.slice(0, 4).map(event => { const student = students.find(s => s.id === event.student_id); return <button key={event.id} className={`riwaq-month-event status-${event.status}`} title={`${student?.full_name || event.title} — ${formatTime(event.starts_at, teacherTimeZone)}`} onClick={() => onEdit(event)}><b>{formatTime(event.starts_at, teacherTimeZone)}</b><span>{student?.full_name || event.title}</span></button>; })}
            {dayEvents.length > 4 && <span className="riwaq-month-more">+{dayEvents.length - 4} مواعيد أخرى</span>}
          </div>
        </div>;
      })}
    </div>
    {loading && <div className="riwaq-month-loading">جاري تحديث الشهر…</div>}
  </section>;
}
