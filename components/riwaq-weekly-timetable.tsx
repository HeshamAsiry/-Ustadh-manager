"use client";

import { useMemo, useState } from "react";
import { Clock, Filter, Globe2, MessageSquare, Pencil, Plus, Repeat2, Trash2, CheckCircle2 } from "lucide-react";

export type RiwaqStudent = {
  id: string;
  full_name: string;
  timezone: string;
  country?: string | null;
  countryFlag?: string | null;
};

export type RiwaqEvent = {
  id: string;
  student_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: string;
  is_makeup: boolean;
  recurring_schedule_id: string | null;
};

const DAYS = [
  [0, "الأحد"],
  [1, "الاثنين"],
  [2, "الثلاثاء"],
  [3, "الأربعاء"],
  [4, "الخميس"],
  [5, "الجمعة"],
  [6, "السبت"],
] as const;

const STATUSES = [
  ["scheduled", "مجدولة"],
  ["completed", "مكتملة"],
  ["cancelled", "ملغاة"],
  ["pending_makeup", "تحتاج تعويض"],
] as const;

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date(value));
}

function duration(event: RiwaqEvent) {
  return Math.max(1, Math.round((new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime()) / 60000));
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function weekDays(cursor: Date) {
  const start = new Date(cursor);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export default function RiwaqWeeklyTimetable({
  events,
  students,
  teacherTimeZone,
  teacherCountry,
  onAdd,
  onEdit,
  onDelete,
  onComplete,
  onWhatsApp,
}: {
  events: RiwaqEvent[];
  students: RiwaqStudent[];
  teacherTimeZone: string;
  teacherCountry?: string;
  onAdd: () => void;
  onEdit: (event: RiwaqEvent) => void;
  onDelete: (event: RiwaqEvent) => void;
  onComplete: (event: RiwaqEvent) => void;
  onWhatsApp: (event: RiwaqEvent, student: RiwaqStudent) => void;
}) {
  const [studentFilter, setStudentFilter] = useState("all");
  const [activeDay, setActiveDay] = useState<number | "all">("all");

  const filtered = useMemo(
    () => events.filter((event) => studentFilter === "all" || event.student_id === studentFilter),
    [events, studentFilter]
  );

  const weeklyHours = useMemo(
    () => (filtered.reduce((sum, event) => sum + duration(event), 0) / 60).toFixed(1),
    [filtered]
  );

  const selectedDays = activeDay === "all" ? DAYS : DAYS.filter(([index]) => index === activeDay);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="calendar-toolbar card" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>جدول الحلقات والمواعيد الأسبوعية</h2>
            <span className="te-status">{filtered.length} موعد أسبوعي · {weeklyHours} ساعة</span>
          </div>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            عرض المواعيد بتوقيتك المعتمد ({teacherCountry || teacherTimeZone}) وبجانبها توقيت كل طالب.
          </p>
        </div>

        <div className="top-actions">
          <label className="filter-select" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Filter size={14} />
            <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}>
              <option value="all">جميع الطلاب ({students.length})</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.countryFlag || ""} {student.full_name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" onClick={onAdd}>
            <Plus size={16} /> إضافة موعد حلقة
          </button>
        </div>
      </div>

      <div className="calendar-tabs" style={{ overflowX: "auto", paddingBottom: 2 }}>
        <button className={activeDay === "all" ? "active" : ""} onClick={() => setActiveDay("all")}>
          كامل الأسبوع ({filtered.length})
        </button>
        {DAYS.map(([index, name]) => {
          const count = filtered.filter((event) => new Date(event.starts_at).getDay() === index).length;
          return (
            <button key={index} className={activeDay === index ? "active" : ""} onClick={() => setActiveDay(index)}>
              {name}{count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      <div className="te-zone-bar">
        <div><Globe2 size={15} /><b>توقيتك: {teacherTimeZone}</b></div>
        <span>الأوقات الرئيسية في الجدول بتوقيتك المحلي</span>
      </div>

      <div className="te-week">
        {selectedDays.map(([index, name]) => {
          const dayEvents = filtered
            .filter((event) => new Date(event.starts_at).getDay() === index)
            .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

          return (
            <section className="te-day" key={index}>
              <header>
                <div><span>{name}</span><b>{dayEvents.length}</b></div>
                <small>{dayEvents.length ? `${dayEvents.length} حصة` : "لا توجد مواعيد"}</small>
              </header>

              <div className="te-day-body">
                {dayEvents.length === 0 ? (
                  <div className="te-empty-day">لا توجد مواعيد مسجلة في هذا اليوم</div>
                ) : dayEvents.map((event) => {
                  const student = students.find((item) => item.id === event.student_id);
                  if (!student) return null;
                  return (
                    <article className={`te-event status-${event.status}`} key={event.id}>
                      <div className="te-event-time">
                        <b>{formatTime(event.starts_at, teacherTimeZone)}</b>
                        <small>{duration(event)} دقيقة</small>
                      </div>

                      <div className="student-card-head" style={{ marginBottom: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: 13 }}>
                            {student.countryFlag || ""} {student.full_name}
                          </strong>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>{student.country || ""}</span>
                        </div>
                        <div className="top-actions" style={{ gap: 2 }}>
                          <button className="icon-btn" title="واتساب" onClick={() => onWhatsApp(event, student)}><MessageSquare size={14} /></button>
                          <button className="icon-btn" title="تعديل" onClick={() => onEdit(event)}><Pencil size={14} /></button>
                          <button className="icon-btn danger-icon" title="حذف" onClick={() => onDelete(event)}><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <span className="te-subject">📖 {event.title}</span>

                      <div className="te-event-meta" style={{ marginTop: 8 }}>
                        <span><Clock size={12} /> توقيتك: <b>{formatTime(event.starts_at, teacherTimeZone)}</b></span>
                        <span><Globe2 size={12} /> الطالب: <b>{formatTime(event.starts_at, student.timezone || event.timezone)}</b></span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
                        <span className="te-status">{event.is_makeup ? "تعويض" : STATUSES.find(([value]) => value === event.status)?.[1] || event.status}</span>
                        {event.recurring_schedule_id && <span style={{ fontSize: 9, color: "var(--muted)" }}><Repeat2 size={11} /> أسبوعي</span>}
                      </div>

                      <button className="outline-btn" style={{ width: "100%", marginTop: 9, justifyContent: "center", fontSize: 10 }} onClick={() => onComplete(event)}>
                        <CheckCircle2 size={13} /> تسجيل إنجاز الحصة
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
