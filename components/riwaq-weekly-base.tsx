"use client";

import { Clock, Globe2, MessageSquare, Pencil, Repeat2, Trash2, CheckCircle2 } from "lucide-react";
import { countryFlag } from "./student-name";
import type { RiwaqEvent, RiwaqStudent } from "./riwaq-weekly-timetable";

const DAYS = [[0, "الأحد"], [1, "الاثنين"], [2, "الثلاثاء"], [3, "الأربعاء"], [4, "الخميس"], [5, "الجمعة"], [6, "السبت"]] as const;
const STATUSES = [["scheduled", "مجدولة"], ["completed", "مكتملة"], ["cancelled", "ملغاة"], ["pending_makeup", "تحتاج تعويض"]] as const;
function formatTime(value: string, timeZone: string) { return new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).format(new Date(value)); }
function duration(event: RiwaqEvent) { return Math.max(1, Math.round((new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime()) / 60000)); }

export default function RiwaqWeeklyBase({ events, students, teacherTimeZone, activeDay, onEdit, onDelete, onComplete, onWhatsApp }: { events: RiwaqEvent[]; students: RiwaqStudent[]; teacherTimeZone: string; activeDay: number | "all"; onEdit: (event: RiwaqEvent) => void; onDelete: (event: RiwaqEvent) => void; onComplete: (event: RiwaqEvent) => void; onWhatsApp: (event: RiwaqEvent, student: RiwaqStudent) => void; }) {
  const selectedDays = activeDay === "all" ? DAYS : DAYS.filter(([index]) => index === activeDay);
  return <>
    <div className="te-zone-bar"><div><Globe2 size={15} /><b>توقيتك: {teacherTimeZone}</b></div><span>الأوقات الرئيسية في الجدول بتوقيتك المحلي</span></div>
    <div className="te-week">
      {selectedDays.map(([index, name]) => {
        const dayEvents = events.filter(e => new Date(e.starts_at).getDay() === index).sort((a,b) => +new Date(a.starts_at) - +new Date(b.starts_at));
        return <section className="te-day" key={index}>
          <header><div><span>{name}</span><b>{dayEvents.length}</b></div><small>{dayEvents.length ? `${dayEvents.length} حصة` : "لا توجد مواعيد"}</small></header>
          <div className="te-day-body">
            {dayEvents.length === 0 ? <div className="te-empty-day">لا توجد مواعيد مسجلة في هذا اليوم</div> : dayEvents.map(event => {
              const student = students.find(s => s.id === event.student_id); if (!student) return null;
              const flag = countryFlag(student.country_code) || student.countryFlag || "";
              return <article className={`te-event status-${event.status}`} key={event.id}>
                <div className="te-event-time"><b>{formatTime(event.starts_at, teacherTimeZone)}</b><small>{duration(event)} دقيقة</small></div>
                <div className="student-card-head" style={{ marginBottom: 8 }}><div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 13 }}>{flag} {student.full_name}</strong><span style={{ fontSize: 10, color: "var(--muted)" }}>{student.country || ""}</span></div><div className="top-actions" style={{ gap: 2 }}><button className="icon-btn" title="واتساب" onClick={() => onWhatsApp(event, student)}><MessageSquare size={14} /></button><button className="icon-btn" title="تعديل" onClick={() => onEdit(event)}><Pencil size={14} /></button><button className="icon-btn danger-icon" title="حذف" onClick={() => onDelete(event)}><Trash2 size={14} /></button></div></div>
                <span className="te-subject">📖 {event.title}</span>
                <div className="te-event-meta" style={{ marginTop: 8 }}><span><Clock size={12} /> توقيتك: <b>{formatTime(event.starts_at, teacherTimeZone)}</b></span><span><Globe2 size={12} /> الطالب: <b>{formatTime(event.starts_at, student.timezone || event.timezone)}</b></span></div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}><span className="te-status">{event.is_makeup ? "تعويض" : STATUSES.find(([value]) => value === event.status)?.[1] || event.status}</span>{event.recurring_schedule_id && <span style={{ fontSize: 9, color: "var(--muted)" }}><Repeat2 size={11} /> أسبوعي</span>}</div>
                <button className="outline-btn" style={{ width: "100%", marginTop: 9, justifyContent: "center", fontSize: 10 }} onClick={() => onComplete(event)}><CheckCircle2 size={13} /> تسجيل إنجاز الحصة</button>
              </article>;
            })}
          </div>
        </section>;
      })}
    </div>
  </>;
}
