
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
  const monthTotalHours=monthEvents.filter(e=>e.event_type==="lesson"&&e.status==="completed").reduce((sum,e)=>sum+durationHours(e),0);
  const monthCompleted=monthEvents.filter(e=>e.event_type==="lesson"&&e.status==="completed").length;
  const monthLabel=new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric"}).format(new Date(today+"T12:00:00"));
  const todayLabel=formatDate(today);

  const signOut=async()=>{setSigningOut(true);await supabase.auth.signOut();window.location.replace("/login")};

  return <main className="dashboard-shell" dir="rtl">
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-symbol">ر</div><div><strong>رواق</strong><span>إدارة التعليم</span></div></div>
      <nav className="main-nav" aria-label="الأقسام الرئيسية">