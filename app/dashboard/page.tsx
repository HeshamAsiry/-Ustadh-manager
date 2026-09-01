"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, Plus, Users, WalletCards } from "lucide-react";
import AppShell from "../../components/app-shell";
import { getEvents, getStudents } from "../../lib/data";
import { supabase } from "../../lib/supabase";
import { requireTeacherId } from "../../lib/current-teacher";
import { formatInTimeZone, formatTimeInZone } from "../../lib/timezone";
import { syncRecurringSchedules } from "../../lib/recurring";
import "./dashboard.css";

type Student={id:string;full_name:string;age:number|null;country_code:string|null;timezone:string;monthly_hours:number;status:string};
type Event={id:string;student_id:string|null;event_type:string;title:string;starts_at:string;ends_at:string;timezone:string;status:string;is_makeup:boolean;students?:{full_name:string}|null};
type AlertItem={kind:"homework"|"payment"|"report";text:string};

function dateKeyInZone(value:string,timeZone:string){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:timeZone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));
 const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
function statusForEvent(e:Event){const now=Date.now(),start=new Date(e.starts_at).getTime(),end=new Date(e.ends_at).getTime();if(e.status==="completed"||end<now)return {label:"انتهت",className:"status-done"};if(start<=now&&now<=end)return {label:"جارٍ الآن",className:"status-live"};return {label:"قادمة",className:"status-next"}}
function Stat({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string|number;detail?:string}){return <div className="card dashboard-stat"><div className="dashboard-stat-top"><div className="dashboard-stat-icon">{icon}</div>{detail&&<span className="pill">{detail}</span>}</div><div className="dashboard-stat-label">{label}</div><div className="dashboard-stat-value">{value}</div></div>}

export default function DashboardPage(){
 const [students,setStudents]=useState<Student[]>([]),[events,setEvents]=useState<Event[]>([]),[alerts,setAlerts]=useState<AlertItem[]>([]),[loading,setLoading]=useState(true);
 async function load(){try{const t=await requireTeacherId();const sync=await syncRecurringSchedules(90);if(sync.error)console.error(sync.error);const s=await getStudents();const now=new Date();const monthStart=new Date(now.getFullYear(),now.getMonth(),1);const nextMonthEnd=new Date(now.getFullYear(),now.getMonth()+2,1);const e=await getEvents(monthStart.toISOString(),nextMonthEnd.toISOString());if(!s.error)setStudents((s.data||[]) as Student[]);if(!e.error)setEvents((e.data||[]) as Event[]);if(supabase){const [h,p,r]=await Promise.all([supabase.from("homework").select("id,title,students(full_name)").eq("teacher_id",t).eq("status","pending"),supabase.from("payments").select("id,amount_due,amount_paid,students(full_name)").eq("teacher_id",t),supabase.from("events").select("id,title,students(full_name)").eq("teacher_id",t).eq("event_type","lesson").eq("status","completed").gte("starts_at",new Date(now.getTime()-30*86400000).toISOString())]);const out:AlertItem[]=[];(h.data||[]).slice(0,5).forEach((x:any)=>out.push({kind:"homework",text:`واجب غير مكتمل: ${x.students?.full_name||x.title}`}));(p.data||[]).filter((x:any)=>Number(x.amount_due||0)>Number(x.amount_paid||0)).slice(0,5).forEach((x:any)=>out.push({kind:"payment",text:`مستحق غير مكتمل: ${x.students?.full_name||"طالب"}`}));if(r.data?.length){const ids=r.data.map((x:any)=>x.id),done=await supabase.from("lesson_reports").select("event_id").eq("teacher_id",t).in("event_id",ids);const doneIds=new Set((done.data||[]).map((x:any)=>x.event_id));(r.data as any[]).filter(x=>!doneIds.has(x.id)).slice(0,5).forEach(x=>out.push({kind:"report",text:`تقرير ناقص: ${x.students?.full_name||x.title}`}))}setAlerts(out.slice(0,8))}}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const active=students.filter(s=>s.status==="active").length;
 const now=new Date(),todayKey=dateKeyInZone(now.toISOString(),Intl.DateTimeFormat().resolvedOptions().timeZone);
 const upcoming=events.filter(e=>e.status!=="cancelled"&&new Date(e.starts_at).getTime()>=Date.now()).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()).slice(0,6);
 const todayEvents=events.filter(e=>dateKeyInZone(e.starts_at,e.timezone)===todayKey&&e.event_type==="lesson"&&e.status!=="cancelled");
 const monthStart=new Date(now.getFullYear(),now.getMonth(),1),monthEnd=new Date(now.getFullYear(),now.getMonth()+1,1);
 const monthEvents=events.filter(e=>new Date(e.starts_at)>=monthStart&&new Date(e.starts_at)<monthEnd&&e.event_type==="lesson"&&e.status!=="cancelled");
 const planned=monthEvents.reduce((n,e)=>n+Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000),0);
 const completed=monthEvents.filter(e=>e.status==="completed").reduce((n,e)=>n+Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000),0);
 const progress=planned?Math.min(100,completed/planned*100):0;
 const dateLabel=now.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"});
 return <AppShell><main className="dashboard-page">
   <section className="dashboard-hero">
    <div className="dashboard-hero-copy"><p className="eyebrow">لوحة التحكم</p><h2>{dateLabel}</h2><p>كل ما تحتاجه لمتابعة يومك الدراسي في نظرة واحدة.</p></div>
    <div className="dashboard-quick"><Link className="outline-btn" href="/students?action=new"><Plus size={16}/> طالب جديد</Link><Link className="primary-btn" href="/calendar?action=new"><CalendarDays size={16}/> إضافة موعد</Link></div>
   </section>
   <section className="dashboard-stats">
    <Stat icon={<Users size={18}/>} label="الطلاب النشطون" value={loading?"…":active}/>
    <Stat icon={<CalendarDays size={18}/>} label="حصص اليوم" value={loading?"…":todayEvents.length}/>
    <Stat icon={<Clock3 size={18}/>} label="الساعات المخططة" value={loading?"…":`${planned.toFixed(1)} ساعة`} detail="هذا الشهر"/>
    <Stat icon={<CheckCircle2 size={18}/>} label="الساعات المنفذة" value={loading?"…":`${completed.toFixed(1)} ساعة`} detail={`${Math.round(progress)}%`}/>
   </section>
   <div className="dashboard-main">
    <section className="card dashboard-card"><div className="dashboard-section-head"><div className="dashboard-section-title"><span className="dashboard-section-title-icon"><CalendarDays size={16}/></span><b>الحصص القادمة</b></div><Link className="dashboard-section-link" href="/calendar">عرض التقويم <ArrowLeft size={13}/></Link></div>
     {upcoming.length?<div className="dashboard-lessons">{upcoming.map(e=>{const st=statusForEvent(e);return <div className="dashboard-lesson" key={e.id}><div className="dashboard-lesson-time">{formatTimeInZone(e.starts_at,e.timezone)}<small>{formatInTimeZone(e.starts_at,e.timezone)}</small></div><div className="dashboard-lesson-dot"/><div className="dashboard-lesson-body"><strong>{e.students?.full_name||e.title}</strong><span>{e.title}{e.is_makeup?" · حصة تعويضية":""}</span></div><span className={`pill dashboard-status ${st.className}`}>{st.label}</span></div>})}</div>:<div className="empty dashboard-empty"><div className="empty-icon"><CalendarDays size={22}/></div><h2>يوم هادئ</h2><p>لا توجد حصص قادمة. يمكنك إضافة موعد جديد من هنا.</p><Link className="primary-btn" href="/calendar?action=new"><Plus size={15}/> إضافة موعد</Link></div>}
    </section>
    <section className="card dashboard-card"><div className="dashboard-section-head"><div className="dashboard-section-title"><span className="dashboard-section-title-icon"><AlertTriangle size={16}/></span><b>يحتاج انتباهك</b></div><Link className="dashboard-section-link" href="/notifications">كل التنبيهات</Link></div>
      {alerts.length?<div className="dashboard-alerts">{alerts.slice(0,6).map((a,i)=><div className="dashboard-alert" key={i}><div className="dashboard-alert-icon">{a.kind==="payment"?<WalletCards size={15}/>:a.kind==="report"?<FileText size={15}/>:<AlertTriangle size={15}/>}</div><span>{a.text}</span></div>)}</div>:<div className="empty dashboard-empty"><div className="empty-icon"><CheckCircle2 size={22}/></div><h3>كل شيء تحت السيطرة</h3><p>لا توجد تنبيهات معلقة حاليًا.</p></div>}
    </section>
   </div>
   <div className="dashboard-bottom">
    <section className="card dashboard-hours"><div className="dashboard-section-head"><div className="dashboard-section-title"><span className="dashboard-section-title-icon"><Clock3 size={16}/></span><b>تقدم ساعات الشهر</b></div><Link className="dashboard-section-link" href="/hours">التفاصيل</Link></div><div className="dashboard-hours-progress"><div className="meter big-meter"><span style={{width:`${progress}%`}}/></div><div className="dashboard-hours-number">{completed.toFixed(1)} / {planned.toFixed(1)} ساعة</div></div></section>
    <section className="card dashboard-students"><div className="dashboard-section-head"><div className="dashboard-section-title"><span className="dashboard-section-title-icon"><Users size={16}/></span><b>الطلاب النشطون</b></div><Link className="dashboard-section-link" href="/students">عرض الكل</Link></div><div className="dashboard-student-list">{students.filter(s=>s.status==="active").slice(0,6).map(s=><Link href={`/students/${s.id}`} className="dashboard-student" key={s.id}><div className="avatar">{s.full_name[0]}</div><div><b>{s.full_name}</b><span>{s.age?`${s.age} سنة`:"—"}</span></div></Link>)}</div></section>
   </div>
 </main></AppShell>
}
