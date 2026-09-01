"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Filter, LayoutGrid, Plus } from "lucide-react";
import RiwaqWeeklyBase from "./riwaq-weekly-base";
import RiwaqMonthlyCalendar from "./riwaq-monthly-calendar";

export type RiwaqStudent = { id: string; full_name: string; timezone: string; country?: string | null; countryFlag?: string | null };
export type RiwaqEvent = { id: string; student_id: string | null; title: string; starts_at: string; ends_at: string; timezone: string; status: string; is_makeup: boolean; recurring_schedule_id: string | null };
const DAYS = [[0,"الأحد"],[1,"الاثنين"],[2,"الثلاثاء"],[3,"الأربعاء"],[4,"الخميس"],[5,"الجمعة"],[6,"السبت"]] as const;
function duration(e:RiwaqEvent){return Math.max(1,Math.round((new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/60000));}

export default function RiwaqWeeklyTimetable({events,students,teacherTimeZone,teacherCountry,onAdd,onEdit,onDelete,onComplete,onWhatsApp}:{events:RiwaqEvent[];students:RiwaqStudent[];teacherTimeZone:string;teacherCountry?:string;onAdd:()=>void;onEdit:(event:RiwaqEvent)=>void;onDelete:(event:RiwaqEvent)=>void;onComplete:(event:RiwaqEvent)=>void;onWhatsApp:(event:RiwaqEvent,student:RiwaqStudent)=>void;}){
 const [studentFilter,setStudentFilter]=useState("all"); const [activeDay,setActiveDay]=useState<number|"all">("all"); const [view,setView]=useState<"week"|"month">("week");
 const filtered=useMemo(()=>events.filter(e=>studentFilter==="all"||e.student_id===studentFilter),[events,studentFilter]);
 const hours=useMemo(()=> (filtered.reduce((s,e)=>s+duration(e),0)/60).toFixed(1),[filtered]);
 return <div className="space-y-6" dir="rtl">
  <div className="calendar-toolbar card" style={{marginBottom:0}}>
   <div><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><h2 style={{margin:0}}>جدول الحلقات والمواعيد</h2><span className="te-status">{filtered.length} موعد · {hours} ساعة</span></div><p className="muted" style={{margin:"4px 0 0"}}>عرض المواعيد بتوقيتك المعتمد ({teacherCountry||teacherTimeZone}) وبجانبها توقيت كل طالب.</p></div>
   <div className="top-actions">
    <label className="filter-select" style={{display:"flex",alignItems:"center",gap:7}}><FilterIcon/><select value={studentFilter} onChange={e=>setStudentFilter(e.target.value)}><option value="all">جميع الطلاب ({students.length})</option>{students.map(s=><option key={s.id} value={s.id}>{s.countryFlag||""} {s.full_name}</option>)}</select></label>
    <div style={{display:"inline-flex",padding:3,border:"1px solid var(--line)",borderRadius:11,background:"#fff",gap:3}}><button type="button" onClick={()=>setView("week")} style={{border:0,borderRadius:8,padding:"8px 11px",display:"inline-flex",alignItems:"center",gap:6,background:view==="week"?"var(--soft)":"transparent",color:view==="week"?"var(--accent-dark)":"var(--muted)",fontWeight:700}}><LayoutGrid size={14}/> أسبوع</button><button type="button" onClick={()=>setView("month")} style={{border:0,borderRadius:8,padding:"8px 11px",display:"inline-flex",alignItems:"center",gap:6,background:view==="month"?"var(--soft)":"transparent",color:view==="month"?"var(--accent-dark)":"var(--muted)",fontWeight:700}}><CalendarDays size={14}/> شهر</button></div>
    <button className="primary-btn" onClick={onAdd}><Plus size={16}/> إضافة موعد حلقة</button>
   </div>
  </div>
  {view==="month"?<RiwaqMonthlyCalendar students={students} teacherTimeZone={teacherTimeZone} studentFilter={studentFilter} onAdd={onAdd} onEdit={onEdit}/>:<><div className="calendar-tabs" style={{overflowX:"auto",paddingBottom:2}}><button className={activeDay==="all"?"active":""} onClick={()=>setActiveDay("all")}>كامل الأسبوع ({filtered.length})</button>{DAYS.map(([i,n])=><button key={i} className={activeDay===i?"active":""} onClick={()=>setActiveDay(i)}>{n}{filtered.filter(e=>new Date(e.starts_at).getDay()===i).length?` (${filtered.filter(e=>new Date(e.starts_at).getDay()===i).length})`:""}</button>)}</div><RiwaqWeeklyBase events={filtered} students={students} teacherTimeZone={teacherTimeZone} activeDay={activeDay} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} onWhatsApp={onWhatsApp}/></>}
 </div>;
}
function FilterIcon(){return <span style={{fontSize:14}}>⚲</span>}
