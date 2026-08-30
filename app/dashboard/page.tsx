"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, FileText, Users, WalletCards } from "lucide-react";
import AppShell from "../../components/app-shell";
import { getEvents, getStudents } from "../../lib/data";

type Student = { id:string; full_name:string; age:number|null; country_code:string|null; timezone:string; monthly_hours:number; status:string };
type Event = { id:string; student_id:string|null; event_type:string; title:string; starts_at:string; ends_at:string; status:string; is_makeup:boolean; students?:{full_name:string}|null };

export default function DashboardPage(){
 const [students,setStudents]=useState<Student[]>([]),[events,setEvents]=useState<Event[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{try{const s=await getStudents();const d=new Date();const to=new Date(d);to.setDate(to.getDate()+30);const e=await getEvents(d.toISOString(),to.toISOString());if(!s.error)setStudents((s.data||[]) as Student[]);if(!e.error)setEvents((e.data||[]) as Event[])}finally{setLoading(false)}})()},[]);
 const active=students.filter(s=>s.status==="active").length;
 const upcoming=events.filter(e=>e.status==="scheduled").slice(0,6);
 const hours=useMemo(()=>upcoming.reduce((n,e)=>n+Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000),0),[upcoming]);
 return <AppShell><section className="hero"><div><p className="eyebrow">لوحة التحكم</p><h2>نظرة سريعة على التدريس اليوم.</h2><p>من هنا تتابع الطلاب والحصص والتقدم والساعات والمدفوعات.</p></div><Link className="outline-btn" href="/calendar">فتح التقويم</Link></section>
 <section className="grid4"><Stat icon={<Users size={17}/>} label="الطلاب النشطون" value={loading?"…":active}/><Stat icon={<CalendarDays size={17}/>} label="الحصص القادمة" value={loading?"…":upcoming.length}/><Stat icon={<Clock3 size={17}/>} label="ساعات الحصص القادمة" value={loading?"…":`${hours.toFixed(1)} ساعة`}/><Stat icon={<WalletCards size={17}/>} label="الإدارة" value="جاهزة"/></section>
 <div className="dashboard-grid"><section className="card"><div className="section-title"><b>الحصص القادمة</b><Link href="/calendar">عرض الكل</Link></div>{upcoming.length?upcoming.map(e=><div className="calendar-event" key={e.id}><div className="cal-time">{new Date(e.starts_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</div><div className="cal-line"><span/></div><div className="cal-body"><b>{e.students?.full_name||e.title}</b><span>{e.title} · {new Date(e.starts_at).toLocaleDateString("ar-EG")}</span></div><span className="pill">{e.is_makeup?"تعويض":"حصة"}</span></div>):<div className="empty"><div className="empty-icon"><CalendarDays size={22}/></div><h2>لا توجد حصص قادمة</h2><p>أضف أول موعد من صفحة التقويم.</p><Link className="primary-btn" href="/calendar?action=new">إضافة موعد</Link></div>}</section>
 <section className="card"><div className="section-title"><b>الطلاب النشطون</b><Link href="/students">إدارة الطلاب</Link></div>{students.filter(s=>s.status==="active").slice(0,6).map(s=><div className="student-row" key={s.id}><div className="avatar">{s.full_name[0]}</div><div className="student-info"><b>{s.full_name}</b><span>{s.age?`${s.age} سنة`:"العمر غير محدد"} · {s.timezone}</span></div></div>)}</section></div></AppShell>
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string|number}){return <div className="card stat"><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>}
