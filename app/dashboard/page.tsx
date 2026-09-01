"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Compass, MessageCircle, Play, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import AppShell from "../../components/app-shell";
import { getEvents, getStudents } from "../../lib/data";
import { formatInTimeZone, formatTimeInZone } from "../../lib/timezone";
import "./dashboard.css";

type Student={id:string;full_name:string;age:number|null;timezone:string;status:string;monthly_hours?:number;meeting_link?:string|null};
type Event={id:string;student_id:string|null;event_type:string;title:string;starts_at:string;ends_at:string;timezone:string;status:string;is_makeup?:boolean;students?:{full_name:string}|null};

const arDays=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const hours=(e:Event)=>Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);

function Stat({icon:Icon,label,value,detail}:{icon:any;label:string;value:string|number;detail:string}){return <div className="card dashboard-stat"><div className="dashboard-stat-top"><div className="dashboard-stat-icon"><Icon size={19}/></div><span className="pill">{detail}</span></div><div className="dashboard-stat-label">{label}</div><div className="dashboard-stat-value">{value}</div></div>}

export default function DashboardPage(){
 const [students,setStudents]=useState<Student[]>([]),[events,setEvents]=useState<Event[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{try{const [s,e]=await Promise.all([getStudents(),getEvents(new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString(),new Date(new Date().getFullYear(),new Date().getMonth()+2,1).toISOString())]);if(!s.error)setStudents((s.data||[]) as Student[]);if(!e.error)setEvents((e.data||[]) as Event[])}finally{setLoading(false)}})()},[]);
 const now=new Date(), day=now.getDay(), dayName=arDays[day];
 const lessons=useMemo(()=>events.filter(e=>e.event_type==="lesson"&&e.status!=="cancelled"),[events]);
 const today=useMemo(()=>lessons.filter(e=>{const d=new Intl.DateTimeFormat("en-CA",{timeZone:e.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(e.starts_at));const n=new Intl.DateTimeFormat("en-CA",{timeZone:e.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);return d===n}).sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at)),[lessons]);
 const upcoming=lessons.filter(e=>+new Date(e.ends_at)>=Date.now()).sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at));
 const next=today.find(e=>+new Date(e.ends_at)>=Date.now())||upcoming[0];
 const active=students.filter(s=>s.status==="active");
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1),monthEnd=new Date(now.getFullYear(),now.getMonth()+1,1);
 const monthLessons=lessons.filter(e=>new Date(e.starts_at)>=monthStart&&new Date(e.starts_at)<monthEnd);
 const completed=monthLessons.filter(e=>e.status==="completed");
 const plannedHours=monthLessons.reduce((n,e)=>n+hours(e),0),completedHours=completed.reduce((n,e)=>n+hours(e),0),progress=plannedHours?Math.round(completedHours/plannedHours*100):0;
 const unread=0;
 return <AppShell><main className="dashboard-page">
  <section className="riwaq-hero"><div className="riwaq-hero-glow"/><div className="riwaq-hero-content"><div className="riwaq-eyebrow"><Sparkles size={15}/> مقرأة المعلم — إدارة المقارئ والتعليم الفردي</div><h1>السلام عليكم ورحمة الله وبركاته، شيخنا الفاضل</h1><p>اليوم هو <b>{dayName}</b>، لديك <strong>{today.length} حصص تدريس</strong> في جدولك.</p></div><div className="riwaq-hero-actions"><Link href="/calendar-riwaq" className="riwaq-light-btn"><Calendar size={17}/> عرض التقويم الكامل</Link><Link href="/students" className="riwaq-dark-btn"><Users size={17}/> إدارة الطلاب ({active.length})</Link></div></section>

  <section className="dashboard-stats"><Stat icon={Users} label="الطلاب النشطون" value={loading?"…":active.length} detail="حاليًا"/><Stat icon={Calendar} label="حصص اليوم" value={loading?"…":today.length} detail={dayName}/><Stat icon={Clock} label="ساعات التدريس" value={loading?"…":completedHours.toFixed(1)} detail="منفذة هذا الشهر"/><Stat icon={TrendingUp} label="نسبة الإنجاز" value={`${progress}%`} detail="هذا الشهر"/></section>

  <div className="riwaq-dashboard-grid">
   <section className="card riwaq-next-card"><div className="riwaq-section-head"><div><span className="riwaq-section-kicker"><Clock size={14}/> التركيز الآن</span><h2>الموعد القادم / النشاط الحالي</h2></div>{next&&<span className="riwaq-live-badge">● {+new Date(next.starts_at)<=Date.now()?"جارٍ الآن":"الموعد التالي"}</span>}</div>{next?<div className="riwaq-next-body"><div className="riwaq-next-info"><div className="riwaq-next-name">{next.students?.full_name||next.title}</div><div className="riwaq-next-sub">{next.title}{next.is_makeup?" · حصة تعويضية":""}</div><div className="riwaq-time-row"><span>⏰ {formatTimeInZone(next.starts_at,next.timezone)}</span><span>مدة الحصة {Math.round(hours(next)*60)} دقيقة</span><span>🌍 {next.timezone||"التوقيت المحلي"}</span></div></div><div className="riwaq-next-actions"><Link href="/calendar-riwaq" className="riwaq-action-primary"><Play size={15}/> فتح الحصة</Link>{next.student_id&&<Link href={`/students/${next.student_id}`} className="riwaq-action-soft"><Users size={15}/> ملف الطالب</Link>}<button className="riwaq-action-soft"><MessageCircle size={15}/> واتساب</button></div></div>:<div className="riwaq-empty"><CheckCircle2 size={40}/><h3>تم إنجاز جميع مواعيد اليوم بنجاح!</h3><p>لا توجد مواعيد أخرى متبقية في جدول هذا اليوم.</p></div>}</section>

   <aside className="card riwaq-summary-card"><div className="riwaq-section-head"><div><span className="riwaq-section-kicker"><Compass size={14}/> ملخص سريع</span><h2>اليوم</h2></div></div><div className="riwaq-summary-list"><div><span>إجمالي الأنشطة</span><b>{today.length}</b></div><div><span>المواعيد القادمة</span><b>{today.filter(e=>+new Date(e.starts_at)>Date.now()).length}</b></div><div><span>الساعات المخططة</span><b>{today.reduce((n,e)=>n+hours(e),0).toFixed(1)}</b></div><div><span>التنبيهات</span><b>{unread}</b></div></div><Link href="/calendar-riwaq" className="riwaq-more">فتح الجدول الكامل <ArrowLeft size={14}/></Link></aside>
  </div>

  <div className="riwaq-dashboard-grid lower"><section className="card riwaq-today-card"><div className="riwaq-section-head"><div><span className="riwaq-section-kicker"><Calendar size={14}/> جدول اليوم</span><h2>حصصك وأنشطتك</h2></div><Link href="/calendar-riwaq" className="riwaq-more">التقويم <ArrowLeft size={14}/></Link></div>{today.length?<div className="riwaq-timeline">{today.map(e=><div className="riwaq-timeline-item" key={e.id}><div className="riwaq-timeline-time">{formatTimeInZone(e.starts_at,e.timezone)}</div><div className="riwaq-timeline-line"><span/></div><div className="riwaq-timeline-content"><b>{e.students?.full_name||e.title}</b><span>{e.title} · {Math.round(hours(e)*60)} دقيقة</span></div><span className={`riwaq-status ${e.status==='completed'?"done":""}`}>{e.status==='completed'?"منتهية":"مجدولة"}</span></div>)}</div>:<div className="riwaq-empty small"><Calendar size={28}/><p>لا توجد حصص اليوم.</p></div>}</section>

   <section className="card riwaq-progress-card"><div className="riwaq-section-head"><div><span className="riwaq-section-kicker"><TrendingUp size={14}/> التقدم</span><h2>ساعات الشهر</h2></div><span className="riwaq-progress-value">{progress}%</span></div><div className="riwaq-progress-ring"><div><b>{completedHours.toFixed(1)}</b><span>ساعة منفذة</span></div></div><div className="riwaq-meter"><span style={{width:`${progress}%`}}/></div><div className="riwaq-progress-meta"><span>منفذ: {completedHours.toFixed(1)}</span><span>مخطط: {plannedHours.toFixed(1)}</span></div><Link href="/hours" className="riwaq-more">تفاصيل الساعات <ArrowLeft size={14}/></Link></section>
  </div>

  <section className="card riwaq-students-card"><div className="riwaq-section-head"><div><span className="riwaq-section-kicker"><Users size={14}/> الطلاب</span><h2>الطلاب النشطون</h2></div><Link href="/students" className="riwaq-more">إدارة الطلاب <ArrowLeft size={14}/></Link></div><div className="riwaq-student-grid">{active.slice(0,8).map(s=><Link href={`/students/${s.id}`} className="riwaq-student" key={s.id}><div className="riwaq-avatar">{s.full_name?.trim()?.charAt(0)||"ط"}</div><div><b>{s.full_name}</b><span>{s.age?`${s.age} سنة`:`طالب نشط`}</span></div><ArrowLeft size={14}/></Link>)}</div></section>
 </main></AppShell>;
}
