
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, Clock3, FileText, GraduationCap, LayoutDashboard, LogOut, Plus, Settings, Users, BookOpenCheck, Bell, UserRound, ArrowLeft, CheckCircle2, BookOpen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { countryFlag } from "../../lib/country";
import "./dashboard.css";

type Student={id:string;full_name:string;country_code:string|null;timezone:string;status:string};
type EventRow={id:string;student_id:string|null;event_type:string;title:string;starts_at:string;ends_at:string;status:string};

const pad=(n:number)=>String(n).padStart(2,"0");
const wallClockToUtc=(date:string,time:string,timezone:string)=>{
  const d=date.split("-").map(Number),t=time.split(":").map(Number),base=Date.UTC(d[0],d[1]-1,d[2],t[0],t[1]);
  const offsetAt=(ms:number)=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));
    const get=(x:string)=>Number(parts.find(p=>p.type===x)?.value||0);
    return Math.round((Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"))-ms)/60000);
  };
  const candidate=base-offsetAt(base)*60000;
  return new Date(base-offsetAt(candidate)*60000);
};
const partsInZone=(iso:string,timezone:string)=>{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
  const get=(x:string)=>parts.find(p=>p.type===x)?.value||"";
  return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
};
const formatTime=(iso:string,timezone:string)=>{const p=partsInZone(iso,timezone);const h=Number(p.time.slice(0,2));return (h%12||12)+":"+p.time.slice(3)+" "+(h>=12?"م":"ص");};
const formatDate=(date:string)=>new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(date+"T12:00:00"));
const durationHours=(e:EventRow)=>Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);
const nextLocalDate=(date:string)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+1);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};

export default function DashboardPage(){
  const [students,setStudents]=useState<Student[]>([]);
  const [events,setEvents]=useState<EventRow[]>([]);
  const [monthEvents,setMonthEvents]=useState<EventRow[]>([]);
  const [teacherTimezone,setTeacherTimezone]=useState("Africa/Cairo");
  const [loading,setLoading]=useState(true);
  const [signingOut,setSigningOut]=useState(false);
  const [message,setMessage]=useState("");

  const load=async()=>{
    setLoading(true);
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){window.location.replace("/login");return}
    const userData=await supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle();
    const tz=userData.data?.settings?.teacherTimeZone||userData.data?.settings?.timezone||"Africa/Cairo";
    setTeacherTimezone(tz);
    const today=partsInZone(new Date().toISOString(),tz).date;
    const startOfDay=wallClockToUtc(today,"00:00",tz).toISOString();
    const endOfDay=wallClockToUtc(nextLocalDate(today),"00:00",tz).toISOString();
    const monthStart=today.slice(0,7)+"-01";
    const nextMonthDate=new Date(monthStart+"T12:00:00");
    nextMonthDate.setMonth(nextMonthDate.getMonth()+1);
    const monthEndDate=nextMonthDate.toISOString().slice(0,10);
    const monthStartUtc=wallClockToUtc(monthStart,"00:00",tz).toISOString();
    const monthEndUtc=wallClockToUtc(monthEndDate,"00:00",tz).toISOString();
    const [s,d,m]=await Promise.all([
      supabase.from("students").select("id,full_name,country_code,timezone,status").neq("status","archived").order("full_name"),
      supabase.from("events").select("id,student_id,event_type,title,starts_at,ends_at,status").gte("starts_at",startOfDay).lt("starts_at",endOfDay).order("starts_at"),
      supabase.from("events").select("id,student_id,event_type,title,starts_at,ends_at,status").gte("starts_at",monthStartUtc).lt("starts_at",monthEndUtc)
    ]);
    if(s.error) setMessage(s.error.message); else setStudents((s.data||[]) as Student[]);
    if(d.error) setMessage(d.error.message); else setEvents((d.data||[]) as EventRow[]);
    if(m.error) setMessage(m.error.message); else setMonthEvents((m.data||[]) as EventRow[]);
    setLoading(false);
  };

  useEffect(()=>{void load()},[]);

  const today=partsInZone(new Date().toISOString(),teacherTimezone).date;
  const todayEvents=events.filter(e=>e.event_type==="lesson");
  const allDayEvents=events;
  const studentMap=useMemo(()=>Object.fromEntries(students.map(s=>[s.id,s])),[students]);
  const orderedLessons=useMemo(()=>todayEvents.filter(e=>e.status!=="cancelled").sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()),[todayEvents]);
  const nextLesson=orderedLessons.find(e=>new Date(e.starts_at).getTime()>Date.now())||orderedLessons.find(e=>e.status!=="completed")||orderedLessons[0];
  const totalTodayHours=todayEvents.filter(e=>e.status==="completed").reduce((sum,e)=>sum+durationHours(e),0);
  const completedToday=todayEvents.filter(e=>e.status==="completed").length;
  const personalToday=allDayEvents.filter(e=>e.event_type==="personal"&&e.status!=="cancelled").length;
  const monthTotalHours=monthEvents.filter(e=>e.event_type==="lesson"&&e.status==="completed").reduce((sum,e)=>sum+durationHours(e),0);  const monthCompleted=monthEvents.filter(e=>e.event_type==="lesson"&&e.status==="completed").length;
  const monthLabel=new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric"}).format(new Date(today+"T12:00:00"));
  const todayLabel=formatDate(today);

  const signOut=async()=>{setSigningOut(true);await supabase.auth.signOut();window.location.replace("/login")};

  return <main className="dashboard-shell" dir="rtl">
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-symbol">ر</div><div><strong>رواق</strong><span>إدارة التعليم</span></div></div>
      <nav className="main-nav" aria-label="الأقسام الرئيسية">
        <a className="nav-item active" href="/dashboard"><LayoutDashboard size={18}/><span>لوحة التحكم</span></a>
        <a className="nav-item" href="/students"><Users size={18}/><span>الطلاب</span><b>{students.length}</b></a>
        <a className="nav-item" href="/calendar"><CalendarDays size={18}/><span>التقويم</span></a>
        <a className="nav-item" href="/lessons"><BookOpenCheck size={18}/><span>الحصص</span></a>
        <a className="nav-item" href="/quran"><BookOpen size={18}/><span>برنامج القرآن</span></a>
        <a className="nav-item" href="/reports"><FileText size={18}/><span>التقارير</span></a>
      </nav>
      <div className="sidebar-bottom"><a className="nav-item" href="/settings"><Settings size={18}/><span>الإعدادات</span></a><button className="nav-item logout" onClick={signOut} disabled={signingOut}><LogOut size={18}/><span>{signingOut?"جارٍ الخروج...":"تسجيل الخروج"}</span></button></div>
    </aside>

    <section className="dashboard-content">
      <header className="topbar"><div><p className="eyebrow">لوحة المعلم</p><h1>مقرأة المعلم</h1></div><div className="top-actions"><button className="icon-button" aria-label="التنبيهات"><Bell size={19}/><i/></button><div className="profile-chip"><span className="avatar"><UserRound size={17}/></span><span>المعلم</span></div></div></header>

      <div className="welcome-card"><div><span className="welcome-kicker">السلام عليكم ورحمة الله وبركاته</span><h2>اليوم <strong>{todayLabel}</strong>، لديك <strong>{todayEvents.length} حصص تدريس</strong> و<strong>{personalToday} مواعيد شخصية</strong> في جدولك.</h2><p>جميع المواعيد مأخوذة من قاعدة البيانات وتُعرض وفق المنطقة الزمنية للمعلم مع تحويل وقت الطالب عند الحاجة.</p></div><div className="welcome-actions"><a className="secondary-button" href="/calendar"><CalendarDays size={17}/> عرض التقويم الكامل</a><a className="primary-button" href="/students"><Users size={17}/> إدارة الطلاب <span>({students.length})</span></a></div></div>

      <section className="section-block"><div className="section-heading"><div><span className="section-index">01</span><h2>الموعد القادم</h2></div><a href="/calendar">عرض الجدول <ChevronLeft size={15}/></a></div>
        {loading?<div className="next-card"><div className="next-info"><p>جارٍ تحميل الجدول...</p></div></div>:nextLesson?<div className="next-card">
          <div className="next-time"><span>القادمة</span><strong>{formatTime(nextLesson.starts_at,teacherTimezone)}</strong><small>إلى {formatTime(nextLesson.ends_at,teacherTimezone)}</small></div><div className="next-divider"/>
          <div className="next-info"><span className="status-pill"><span/> {nextLesson.status==="completed"?"مكتملة":nextLesson.status==="pending"?"قيد الانتظار":"موعد مجدول"}</span><h3>{countryFlag(studentMap[nextLesson.student_id||""]?.country_code||"")} {nextLesson.title}</h3><p><Clock3 size={15}/> {studentMap[nextLesson.student_id||""]?.full_name||"طالب"} · {teacherTimezone}</p></div><a className="arrow-button" href="/lessons"><ArrowLeft size={19}/></a>
        </div>:<div className="next-card"><div className="next-info"><h3>لا توجد حصة قادمة اليوم</h3><p>أضف موعدًا من صفحة التقويم.</p></div></div>}
      </section>

      <section className="section-block"><div className="section-heading"><div><span className="section-index">02</span><h2>ملخص نشاط اليوم</h2></div></div>
        <div className="stats-grid"><div className="stat-card"><span className="stat-icon"><GraduationCap size={19}/></span><div><strong>{todayEvents.length}</strong><span>حصص اليوم</span></div></div><div className="stat-card"><span className="stat-icon"><Clock3 size={19}/></span><div><strong>{totalTodayHours.toFixed(1)}</strong><span>ساعة مكتملة</span></div></div><div className="stat-card"><span className="stat-icon"><CheckCircle2 size={19}/></span><div><strong>{completedToday}</strong><span>حصص مكتملة</span></div></div><div className="stat-card"><span className="stat-icon"><Bell size={19}/></span><div><strong>{personalToday}</strong><span>مواعيد شخصية</span></div></div></div>
      </section>

      <section className="section-block"><div className="section-heading"><div><span className="section-index">03</span><h2>جدول مواعيد اليوم بالتفصيل</h2></div><span className="muted-label">{todayLabel}</span></div>
        <div className="schedule-card">{orderedLessons.length?orderedLessons.map((lesson)=><div className="schedule-row" key={lesson.id}><div className="schedule-time"><strong>{formatTime(lesson.starts_at,teacherTimezone)}</strong><span>{formatTime(lesson.ends_at,teacherTimezone)}</span></div><div className={"timeline-dot "+(lesson.status==="completed"?"done":"next")}/><div className="schedule-main"><div><h3><span className="student-country-flag">{countryFlag(studentMap[lesson.student_id||""]?.country_code||"")}</span>{studentMap[lesson.student_id||""]?.full_name||"طالب"}</h3><span>{lesson.title}</span></div><p>{lesson.status==="completed"?"تم تسجيل الحصة":"موعد مجدول"}</p></div><span className={"lesson-badge "+(lesson.status==="completed"?"":"now")}>{lesson.status==="completed"?"مكتملة":"قادم"}</span></div>):<div className="schedule-footer"><Clock3 size={16}/><span>لا توجد حصص مسجلة لهذا اليوم.</span></div>}<div className="schedule-footer"><Clock3 size={16}/><span>التوقيت الأساسي للجدول: {teacherTimezone}.</span></div></div>
      </section>

      <section className="section-block"><div className="section-heading"><div><span className="section-index">04</span><h2>إحصائيات وإنجازات الشهر الحالي</h2></div><a href="/reports">عرض التقارير الموسعة <ChevronLeft size={15}/></a></div>
        <div className="month-card"><div className="month-head"><div><span>الشهر الحالي</span><h3>{monthLabel}</h3></div><a href="/reports">التفاصيل <ArrowLeft size={15}/></a></div><div className="month-stats"><div><strong>{monthTotalHours.toFixed(1)}</strong><span>إجمالي ساعات التدريس المسجلة</span></div><div><strong>{monthCompleted}</strong><span>الحصص المكتملة</span></div><div><strong>{students.length}</strong><span>الطلاب النشطون</span></div><div><strong>—</strong><span>متوسط الحضور</span></div></div><div className="progress-note"><span>تُحسب الساعات من الحصص المكتملة المسجلة في قاعدة البيانات.</span><a href="/lessons"><Plus size={15}/> تسجيل حصة</a></div></div>
      </section>

      <section className="section-block quick-section"><div className="section-heading"><div><span className="section-index">05</span><h2>الوصول السريع للأقسام الرئيسية</h2></div></div><div className="quick-grid">{[{href:"/students",label:"الطلاب",detail:"إدارة الطلاب وملفاتهم",icon:Users},{href:"/calendar",label:"التقويم",detail:"الحصص والمواعيد",icon:CalendarDays},{href:"/lessons",label:"الحصص",detail:"تسجيل ومتابعة الحصص",icon:BookOpenCheck},{href:"/quran",label:"برنامج القرآن",detail:"الحفظ والمراجعة والمتابعة",icon:BookOpen},{href:"/reports",label:"التقارير",detail:"التقارير والإنجازات",icon:FileText}].map(({href,label,detail,icon:Icon})=><a className="quick-card" href={href} key={href}><span className="quick-icon"><Icon size={20}/></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronLeft size={17}/></a>)}</div></section>

      {message&&<div style={{padding:"12px",marginTop:"16px",border:"1px solid #ddd",borderRadius:"10px"}}>{message}</div>}
      <footer className="dashboard-footer">رواق · مقرأة المعلم وإدارة التعليم</footer>
    </section>
  </main>;
}