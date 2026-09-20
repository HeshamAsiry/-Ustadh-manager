"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ListFilter, MoreHorizontal, Plus, X } from "lucide-react";
import { countryFlag } from "../lib/country";
import { supabase } from "../lib/supabase";
import "./calendar.css";

type ViewMode = "month" | "week" | "day";
type Student = {
  id: string;
  full_name: string;
  country_code: string | null;
  country_name?: string | null;
  timezone: string;
};
type Appointment = {
  id: string;
  date: string;
  time: string;
  end: string;
  studentId: string;
  studentIds: string[];
  student: string;
  country: string;
  countryCode: string;
  timezone: string;
  subject: string;
  duration: number;
  status: string;
};
type FormState = {
  date: string;
  time: string;
  studentId: string;
  subject: string;
  duration: number;
  status: string;
};

const days = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const pad = (n:number) => String(n).padStart(2, "0");
const dateKey = (d:Date) => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
const addDays = (date:Date, amount:number) => { const d = new Date(date); d.setDate(d.getDate()+amount); return d; };
const minutes = (time:string) => { const parts=time.split(":").map(Number); return parts[0]*60+parts[1]; };
const endTime = (time:string, duration:number) => { const total=minutes(time)+duration; return pad(Math.floor((total%1440)/60))+":"+pad(total%60); };
const formatTime12 = (time:string) => { const p=time.split(":").map(Number); const h=p[0],m=p[1]; return (h%12||12)+":"+pad(m)+(h>=12?" م":" ص"); };
const formatArabicDate = (date:Date) => new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(date);
const monthTitle = (date:Date) => new Intl.DateTimeFormat("ar-EG",{month:"long",year:"numeric"}).format(date);
const weekStart = (date:Date) => addDays(date,-date.getDay());
const countryName = (code:string) => ({BE:"بلجيكا",FR:"فرنسا",DE:"ألمانيا",AE:"الإمارات العربية المتحدة"} as Record<string,string>)[code] || code || "—";

const teacherWallClockToUtc = (date:string, time:string, timezone:string) => {
  const d=date.split("-").map(Number), t=time.split(":").map(Number);
  const base=Date.UTC(d[0],d[1]-1,d[2],t[0],t[1]);
  const offsetAt=(ms:number)=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));
    const get=(type:string)=>Number(parts.find(p=>p.type===type)?.value||0);
    return Math.round((Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"))-ms)/60000);
  };
  const first=offsetAt(base);
  const candidate=base-first*60000;
  const second=offsetAt(candidate);
  return new Date(base-second*60000);
};

const zonedParts = (iso:string, timezone:string) => {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
  return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
};

const emptyForm = (date:string):FormState => ({
  date,
  time:"18:00",
  studentId:"",
  subject:"القرآن الكريم",
  duration:60,
  status:"scheduled"
});

export default function CalendarPage(){
  const todayKey=dateKey(new Date());
  const [view,setView]=useState<ViewMode>("week");
  const [selectedDate,setSelectedDate]=useState(todayKey);
  const [appointments,setAppointments]=useState<Appointment[]>([]);
  const [students,setStudents]=useState<Student[]>([]);
  const [teacherTimezone,setTeacherTimezone]=useState("Africa/Cairo");
  const [selectedStudentId,setSelectedStudentId]=useState("");
  const [converterTime,setConverterTime]=useState("18:00");
  const [filter,setFilter]=useState("الكل");
  const [modalOpen,setModalOpen]=useState(false);
  const [menuId,setMenuId]=useState<string|null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [form,setForm]=useState<FormState>(emptyForm(todayKey));
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  const load=async()=>{
    setLoading(true);
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setMessage("انتهت جلسة الدخول.");setLoading(false);return}
    const [studentResult,eventResult,userDataResult]=await Promise.all([
      supabase.from("students").select("id,full_name,country_code,country_name,timezone").neq("status","archived").order("full_name"),
      supabase.from("events").select("id,student_id,title,starts_at,ends_at,status").eq("event_type","lesson").order("starts_at"),
      supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle()
    ]);
    if(studentResult.error)setMessage(studentResult.error.message);
    const studentRows=(studentResult.data||[]) as Student[];
    setStudents(studentRows);
    const tz=userDataResult.data?.settings?.teacherTimeZone||userDataResult.data?.settings?.timezone||"Africa/Cairo";
    setTeacherTimezone(tz);
    if(eventResult.error){setMessage(eventResult.error.message);setAppointments([]);}
    else{
      const byId:Record<string,Student>=Object.fromEntries(studentRows.map(s=>[s.id,s]));
      const eventRows=(eventResult.data||[]) as Array<{id:string;student_id:string|null;title:string|null;starts_at:string;ends_at:string;status:string}>;
      const eventIds=eventRows.map(e=>e.id);
      let participantRows:Array<{event_id:string;student_id:string}> = [];
      if(eventIds.length){
        const participantResult=await supabase.from("event_students").select("event_id,student_id").in("event_id",eventIds);
        if(participantResult.error)setMessage(participantResult.error.message);
        else participantRows=(participantResult.data||[]) as Array<{event_id:string;student_id:string}>;
      }
      const participantsByEvent:Record<string,string[]>={};
      participantRows.forEach(row=>{
        if(!participantsByEvent[row.event_id])participantsByEvent[row.event_id]=[];
        participantsByEvent[row.event_id].push(row.student_id);
      });
      setAppointments(eventRows.map((e)=>{
        const ids=(participantsByEvent[e.id]&&participantsByEvent[e.id].length?participantsByEvent[e.id]:(e.student_id?[e.student_id]:[]));
        const names=ids.map((id)=>byId[id]?.full_name).filter((name):name is string=>Boolean(name));
        const primary=byId[ids[0]||e.student_id];
        const parts=zonedParts(e.starts_at,tz), endParts=zonedParts(e.ends_at,tz);
        const duration=Math.max(0,Math.round((new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/60000));
        const code=primary?.country_code||"";
        return {
          id:e.id,
          date:parts.date,
          time:parts.time,
          end:endParts.time,
          studentId:e.student_id,
          studentIds:ids,
          student:names.length>1?names.join("، "):(names[0]||"طالب محذوف"),
          country:countryName(code),
          countryCode:code,
          timezone:primary?.timezone||"Africa/Cairo",
          subject:e.title||"القرآن الكريم",
          duration,
          status:e.status
        };
      }));
    }
    setLoading(false);
  };

  useEffect(()=>{void load()},[]);

  const selected=new Date(selectedDate+"T12:00:00");
  const week=weekStart(selected);
  const weekDates=Array.from({length:7},(_,i)=>addDays(week,i));
  const subjects=useMemo(()=>Array.from(new Set(appointments.map(a=>a.subject))).sort(),[appointments]);
  const visibleAppointments=useMemo(()=>filter==="الكل"?appointments:appointments.filter(a=>a.subject===filter),[appointments,filter]);
  const weekAppointments=visibleAppointments.filter(a=>a.date>=dateKey(weekDates[0])&&a.date<=dateKey(weekDates[6]));
  const totalHours=weekAppointments.reduce((sum,a)=>sum+a.duration,0)/60;
  const dayAppointments=visibleAppointments.filter(a=>a.date===selectedDate).sort((a,b)=>minutes(a.time)-minutes(b.time));
  const conflicts=useMemo(()=>{
    const result:Array<[string,string]>=([]);
    for(let i=0;i<appointments.length;i++){
      for(let j=i+1;j<appointments.length;j++){
        const a=appointments[i],b=appointments[j];
        if(a.date===b.date&&minutes(a.time)<minutes(b.end)&&minutes(b.time)<minutes(a.end))result.push([a.id,b.id]);
      }
    }
    return result;
  },[appointments]);
  const conflictIds=new Set(conflicts.flat());

  const openAdd=(date=selectedDate,time="18:00")=>{
    setEditingId(null);
    setMenuId(null);