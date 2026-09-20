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
  eventType: "lesson" | "personal";
  notes: string | null;
};
type FormState = {
  date: string;
  time: string;
  studentId: string;
  subject: string;
  title: string;
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
  title:"",
  duration:60,
  status:"scheduled"
});

export default function CalendarPage({scope="lessons"}:{scope?: "lessons"|"personal"|"all"}){
  const [todayKey,setTodayKey]=useState(dateKey(new Date()));
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
  const [editingParticipantIds,setEditingParticipantIds]=useState<string[]>([]);
  const personalOnly=scope==="personal";

  const load=async()=>{
    setLoading(true);
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setMessage("انتهت جلسة الدخول.");setLoading(false);return}
    let eventQuery=supabase.from("events").select("id,student_id,title,starts_at,ends_at,status,event_type,notes").order("starts_at");
    if(scope==="lessons")eventQuery=eventQuery.eq("event_type","lesson");
    if(scope==="personal")eventQuery=eventQuery.eq("event_type","personal");
    const [studentResult,eventResult,userDataResult]=await Promise.all([
      supabase.from("students").select("id,full_name,country_code,country_name,timezone").neq("status","archived").order("full_name"),
      eventQuery,
      supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle()
    ]);
    if(studentResult.error)setMessage(studentResult.error.message);
    const studentRows=(studentResult.data||[]) as Student[];
    setStudents(studentRows);
    const tz=userDataResult.data?.settings?.teacherTimeZone||userDataResult.data?.settings?.timezone||"Africa/Cairo";
    setTeacherTimezone(tz);
    const teacherToday=zonedParts(new Date().toISOString(),tz).date;
    setTodayKey(teacherToday);
    if(eventResult.error){setMessage(eventResult.error.message);setAppointments([]);}
    else{
      const byId=Object.fromEntries(studentRows.map(s=>[s.id,s]));
      const eventIds=(eventResult.data||[]).map((e:any)=>e.id);
      const participantResult=eventIds.length
        ? await supabase.from("event_students").select("event_id,student_id").in("event_id",eventIds)
        : {data:[],error:null};
      if(participantResult.error)setMessage(participantResult.error.message);
      const participantsByEvent:Record<string,string[]>={};
      (participantResult.data||[]).forEach((row:any)=>{
        if(!participantsByEvent[row.event_id])participantsByEvent[row.event_id]=[];
        participantsByEvent[row.event_id].push(row.student_id);
      });
      setAppointments((eventResult.data||[]).map((e:any)=>{
        const ids=(participantsByEvent[e.id]&&participantsByEvent[e.id].length?participantsByEvent[e.id]:[e.student_id]).filter(Boolean);
        const names=ids.map((id:string)=>byId[id]?.full_name).filter(Boolean) as string[];
        const primary=byId[ids[0]||e.student_id];
        const eventType=(e.event_type==="personal"?"personal":"lesson") as "personal"|"lesson";
        const parts=zonedParts(e.starts_at,tz), endParts=zonedParts(e.ends_at,tz);
        const duration=Math.max(0,Math.round((new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/60000));
        const code=primary?.country_code||"";
        return {id:e.id,date:parts.date,time:parts.time,end:endParts.time,studentId:e.student_id,studentIds:ids,student:eventType==="personal"?"موعد شخصي":(names.length>1?names.join("، "):(names[0]||"طالب محذوف")),country:eventType==="personal"?"":countryName(code),countryCode:eventType==="personal"?"":code,timezone:eventType==="personal"?tz:(primary?.timezone||"Africa/Cairo"),subject:e.title||"بدون عنوان",duration,status:e.status,eventType,notes:e.notes||null};
      }));
    }
    setLoading(false);
  };

  useEffect(()=>{void load()},[scope]);

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
        const aStart=teacherWallClockToUtc(a.date,a.time,teacherTimezone).getTime();
        const bStart=teacherWallClockToUtc(b.date,b.time,teacherTimezone).getTime();
        const aEnd=aStart+a.duration*60000;
        const bEnd=bStart+b.duration*60000;
        if(aStart<bEnd&&bStart<aEnd)result.push([a.id,b.id]);
      }
    }
    return result;
  },[appointments]);
  const conflictIds=new Set(conflicts.flat());

  const selectedStudent=students.find(s=>s.id===selectedStudentId)||students[0];

  const openAdd=(date=selectedDate,time="18:00")=>{
    setEditingId(null);
    setEditingParticipantIds([]);
    setMenuId(null);
    const firstStudent=personalOnly?"":(students[0]?.id||"");
    setForm({...emptyForm(date),time,studentId:firstStudent,title:"",subject:"القرآن الكريم"});
    setModalOpen(true);
  };
  const openEdit=(a:Appointment)=>{
    setEditingId(a.id);
    setEditingParticipantIds(a.studentIds);
    setForm({date:a.date,time:a.time,studentId:a.studentId,subject:a.subject,title:a.eventType==="personal"?a.subject:"",duration:a.duration,status:a.status});
    setModalOpen(true);
    setMenuId(null);
  };

  const saveAppointment=async()=>{
    const student=students.find(s=>s.id===form.studentId);
    if(!personalOnly && !student){setMessage("اختر طالبًا أولًا.");return}
    if(personalOnly && !form.title.trim()){setMessage("اكتب عنوان الموعد.");return}
    const start=teacherWallClockToUtc(form.date,form.time,teacherTimezone);
    const end=new Date(start.getTime()+form.duration*60000);
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())){setMessage("راجع تاريخ ووقت الموعد.");return}
    const payload={
      teacher_id:(await supabase.auth.getUser()).data.user?.id,
      student_id:personalOnly?null:student?.id||null,
      event_type:personalOnly?"personal":"lesson",
      title:personalOnly?form.title.trim():form.subject+" — "+student!.full_name,
      starts_at:start.toISOString(),
      ends_at:end.toISOString(),
      timezone:teacherTimezone,
      status:form.status,
      is_makeup:false,
      reminder_minutes:30,
      notes:editingId?(appointments.find(a=>a.id===editingId)?.notes??null):null
    };
    let eventId=editingId;
    const result=editingId
      ? await supabase.from("events").update(payload).eq("id",editingId).select("id").single()
      : await supabase.from("events").insert(payload).select("id").single();

    if(result.error||!result.data){
      const msg=result.error?.message||"تعذر حفظ الموعد.";
      setMessage(/conflict|exclusion|overlap|tstzrange/i.test(msg)?"هذا الموعد يتداخل مع موعد آخر للمعلم. اختر وقتًا مختلفًا.":msg);
      return;
    }
    eventId=result.data.id;
    if(!personalOnly){
      const preservingGroup=Boolean(editingId&&editingParticipantIds.length>1);
      if(!preservingGroup){
        if(editingId)await supabase.from("event_students").delete().eq("event_id",eventId);
        const participantsResult=await supabase.from("event_students").insert([{event_id:eventId,student_id:student!.id}]);
        if(participantsResult.error){
          if(!editingId)await supabase.from("events").delete().eq("id",eventId);
          setMessage(participantsResult.error.message);
          return;
        }
      }
    }
    setModalOpen(false);
    setSelectedDate(form.date);
    await load();
    setMessage(editingId?"تم تحديث الموعد.":"تمت إضافة الموعد.");
  };

  const deleteAppointment=async(id:string)=>{
    if(!window.confirm("هل تريد إلغاء هذا الموعد؟"))return;
    const result=await supabase.from("events").update({status:"cancelled"}).eq("id",id);
    if(result.error)setMessage(result.error.message);
    else{setMenuId(null);await load();setMessage("تم إلغاء الموعد.")}
  };

  const navigate=(direction:number)=>{
    if(view==="month")setSelectedDate(dateKey(new Date(selected.getFullYear(),selected.getMonth()+direction,1)));
    else setSelectedDate(dateKey(addDays(selected,view==="week"?direction*7:direction)));
  };
  const goToday=()=>setSelectedDate(zonedParts(new Date().toISOString(),teacherTimezone).date);

  const calendarCells=useMemo(()=>{
    const first=new Date(selected.getFullYear(),selected.getMonth(),1);
    const count=new Date(selected.getFullYear(),selected.getMonth()+1,0).getDate();
    const cells:(Date|null)[]=Array(first.getDay()).fill(null);
    for(let i=1;i<=count;i++)cells.push(new Date(selected.getFullYear(),selected.getMonth(),i));
    while(cells.length%7)cells.push(null);
    return cells;
  },[selected]);

  const converterStudent=students.find(s=>s.id===selectedStudentId)||selectedStudent;

  return <main className="calendar-shell" dir="rtl">
    <header className="calendar-header">
      <div><span className="calendar-eyebrow">{personalOnly?"المواعيد الشخصية":"إدارة المواعيد"}</span><h1>{personalOnly?"جدولي الشخصي":"التقويم والمواعيد"}</h1><p>{personalOnly?"مواعيدك الشخصية محفوظة مع بقية أحداث رواق في قاعدة البيانات.":"المواعيد محفوظة في قاعدة البيانات، وتُعرض بتوقيت المعلم مع تحويل وقت الطالب تلقائيًا."}</p></div>
      <button className="add-appointment" onClick={()=>openAdd()} disabled={loading||(!personalOnly&&students.length===0)}><Plus size={18}/> {personalOnly?"إضافة موعد شخصي":"إضافة موعد"}</button>
    </header>

    {!personalOnly&&<section className="timezone-card">
      <div className="timezone-title"><span className="timezone-icon"><ArrowLeftRight size={18}/></span><div><h2>محول فروق التوقيت المباشر</h2><p>حوّل وقت الموعد بين توقيتك وتوقيت الطالب مع مراعاة التوقيت الصيفي.</p></div></div>
      <div className="timezone-controls">
        <label>الطالب<select value={selectedStudentId||(students[0]?.id||"")} onChange={e=>setSelectedStudentId(e.target.value)}>
          {students.map(s=><option key={s.id} value={s.id}>{countryFlag(s.country_code||"")} {s.full_name}</option>)}
        </select></label>
        <label>توقيت المعلم<input type="time" value={converterTime} onChange={e=>setConverterTime(e.target.value)}/><span className="time-helper">{formatTime12(converterTime)}</span></label>
        <div className="timezone-result"><span>التوقيت المحلي للطالب</span><strong>{converterStudent?formatTime12(zonedParts(teacherWallClockToUtc(selectedDate,converterTime,teacherTimezone).toISOString(),converterStudent.timezone).time):"—"}</strong><small>{converterStudent?countryName(converterStudent.country_code||"")+" · "+converterStudent.timezone:"لا يوجد طلاب مسجلون"}</small></div>
      </div>
    </section>}

    {conflicts.length>0&&<button className="conflict-alert" onClick={()=>setView("day")}><span><AlertTriangle size={19}/></span><div><strong>تم اكتشاف تعارض في البيانات المعروضة.</strong><small>تعارضات البيانات القديمة يتم إظهارها هنا، أما المواعيد الجديدة فيمنعها مستوى قاعدة البيانات.</small></div><ChevronLeft size={18}/></button>}

    <section className="calendar-toolbar">
      <div className="view-switch"><button className={view==="month"?"active":""} onClick={()=>setView("month")}>الشهر</button><button className={view==="week"?"active":""} onClick={()=>setView("week")}>الأسبوع</button><button className={view==="day"?"active":""} onClick={()=>setView("day")}>اليوم</button></div>
      <div className="date-nav"><button onClick={()=>navigate(1)} aria-label="التالي"><ChevronRight size={17}/></button><strong>{view==="month"?monthTitle(selected):view==="day"?formatArabicDate(selected):formatArabicDate(weekDates[0])+" - "+new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long"}).format(weekDates[6])}</strong><button onClick={()=>navigate(-1)} aria-label="السابق"><ChevronLeft size={17}/></button><button className="today-button" onClick={goToday}>اليوم</button></div>
      <label className="filter-button"><ListFilter size={17}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="الكل">الكل</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    </section>

    {loading?<div className="empty-day">جارٍ تحميل المواعيد والطلاب...</div>:view==="month"&&<section className="month-calendar reference-month">
      <div className="month-weekdays">{days.map(d=><span key={d}>{d}</span>)}</div>
      <div className="month-grid">{calendarCells.map((date,i)=>{
        if(!date)return <div className="month-empty" key={"empty-"+i}/>;
        const key=dateKey(date), items=visibleAppointments.filter(a=>a.date===key).sort((a,b)=>minutes(a.time)-minutes(b.time)), isToday=key===todayKey;
        return <button className={"month-day "+(isToday?"current":"")} key={key} onClick={()=>{setSelectedDate(key);setView("day");}}>
          <div className="month-day-head"><b>{date.getDate()}</b>{items.length>0&&<small>{items.length} مواعيد</small>}</div>
          <div className="month-items">{items.slice(0,3).map(a=><span key={a.id} className={conflictIds.has(a.id)?"has-conflict":""}><i/><strong>{formatTime12(a.time)}</strong><em><span className="student-country-flag">{countryFlag(a.countryCode)}</span>{a.student}</em></span>)}{items.length>3&&<small className="more-month">+ {items.length-3} أخرى</small>}</div>
        </button>;
      })}</div>
    </section>}

    {!loading&&view!=="month"&&<section className="week-summary">
      <div><span>المواعيد الأسبوعية</span><strong>{weekAppointments.length} <em>موعدًا</em></strong></div>
      <div><span>إجمالي الساعات</span><strong>{totalHours.toFixed(1)} <em>ساعة</em></strong></div>
      <div className="summary-days">{days.map((d,i)=>{const key=dateKey(weekDates[i]);return <button key={d} onClick={()=>setSelectedDate(key)} className={selectedDate===key?"selected":""}><b>{visibleAppointments.filter(a=>a.date===key).length}</b><span>{d}</span></button>})}</div>
    </section>}

    {!loading&&view==="week"&&<section className="week-grid">
      {weekDates.map((date,i)=>{const key=dateKey(date),items=visibleAppointments.filter(a=>a.date===key).sort((a,b)=>minutes(a.time)-minutes(b.time));return <div className={"day-column "+(selectedDate===key?"selected":"")} key={key}>
        <button className="day-heading" onClick={()=>{setSelectedDate(key);setView("day");}}><span>{days[i]} <small>{date.getDate()}</small></span><strong>{items.length}</strong></button>
        <div className="day-list">{items.map(a=><article className={"appointment-card "+(conflictIds.has(a.id)?"appointment-conflict":"")} key={a.id}>
          <div className="appointment-time"><strong>{formatTime12(a.time)}</strong>{personalOnly?<span className="student-time">توقيت المعلم</span>:<span className="student-time">الطالب: {formatTime12(zonedParts(teacherWallClockToUtc(a.date,a.time,teacherTimezone).toISOString(),a.timezone).time)}</span>}</div>
          <div className="appointment-main"><h3>{!personalOnly&&<span className="student-country-flag">{countryFlag(a.countryCode)}</span>}{a.student}</h3><p>{a.subject}</p><small>{personalOnly?"موعد شخصي":a.country+" · "} {a.duration} دقيقة</small></div>
          <button className="more" onClick={()=>setMenuId(menuId===a.id?null:a.id)}><MoreHorizontal size={19}/></button>
          {menuId===a.id&&<div className="appointment-menu"><button onClick={()=>openEdit(a)}>تعديل</button><button onClick={()=>deleteAppointment(a.id)}>إلغاء الموعد</button></div>}
        </article>)}</div>
        <button className="column-add" onClick={()=>openAdd(key)}><Plus size={15}/> إضافة موعد</button>
      </div>})}
    </section>}

    {!loading&&view==="day"&&<section className="day-view">
      <div className="day-view-head"><div><span>الجدول اليومي</span><h2>{formatArabicDate(selected)}</h2></div><span className="day-count">{dayAppointments.length} مواعيد</span></div>
      {dayAppointments.length?dayAppointments.map(a=><article className={"detail-appointment "+(conflictIds.has(a.id)?"appointment-conflict":"")} key={a.id}>
        <div className="detail-time"><strong>{formatTime12(a.time)}</strong><span>{formatTime12(a.end)}</span></div><div className="detail-line"/><div className="detail-info"><h3>{!personalOnly&&<span className="student-country-flag">{countryFlag(a.countryCode)}</span>}{a.student}</h3><p>{a.subject}{!personalOnly&&a.country?" · "+a.country:""}</p><span>{personalOnly?<><Clock3 size={14}/> التوقيت: {teacherTimezone}</>:<><Clock3 size={14}/> توقيت الطالب: {formatTime12(zonedParts(teacherWallClockToUtc(a.date,a.time,teacherTimezone).toISOString(),a.timezone).time)}</>}</span></div><span className="status">{a.status==="completed"?"مكتملة":a.status==="cancelled"?"ملغاة":a.status==="pending"?"قيد الانتظار":"مؤكد"}</span><button className="more" onClick={()=>setMenuId(menuId===a.id?null:a.id)}><MoreHorizontal size={18}/></button>{menuId===a.id&&<div className="appointment-menu"><button onClick={()=>openEdit(a)}>تعديل</button><button onClick={()=>deleteAppointment(a.id)}>إلغاء الموعد</button></div>}
      </article>):<div className="empty-day">لا توجد مواعيد في هذا اليوم.<button className="add-inline" onClick={()=>openAdd()}>إضافة موعد</button></div>}
    </section>}

    <footer className="calendar-footer"><span><Clock3 size={15}/> جميع الأوقات الأساسية معروضة بتوقيت المعلم: {teacherTimezone}</span><span><CalendarDays size={15}/> المواعيد الجديدة تُحفظ مباشرة في قاعدة البيانات مع منع التعارضات.</span></footer>

    {modalOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}><section className="appointment-modal" dir="rtl">
      <header><div><span>إدارة الموعد</span><h2>{editingId?"تعديل الموعد":"إضافة موعد جديد"}</h2></div><button onClick={()=>setModalOpen(false)}><X size={19}/></button></header>
      <div className="modal-grid">
        {personalOnly?<label className="full-field">عنوان الموعد<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="مثال: اجتماع شخصي"/></label>:<label>اسم الطالب<select value={form.studentId} disabled={Boolean(editingId&&editingParticipantIds.length>1)} onChange={e=>setForm({...form,studentId:e.target.value})}>{students.map(s=><option key={s.id} value={s.id}>{countryFlag(s.country_code||"")} {s.full_name}</option>)}</select></label>}
        <label>التاريخ<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>الوقت بتوقيت المعلم<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/><span className="time-helper">{formatTime12(form.time)}</span></label>
        <label>المدة<select value={form.duration} onChange={e=>setForm({...form,duration:Number(e.target.value)})}><option value={30}>30 دقيقة</option><option value={45}>45 دقيقة</option><option value={60}>60 دقيقة</option><option value={90}>90 دقيقة</option><option value={120}>120 دقيقة</option></select></label>
        {!personalOnly&&<label>المادة<select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option>القرآن الكريم</option><option>العربية</option><option>التجويد</option><option>الدراسات الإسلامية</option>{subjects.filter(s=>!["القرآن الكريم","العربية","التجويد","الدراسات الإسلامية"].includes(s)).map(s=><option key={s}>{s}</option>)}</select></label>}
        <label>الحالة<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="scheduled">مؤكد</option><option value="pending">في الانتظار</option><option value="completed">مكتملة</option><option value="cancelled">ملغاة</option></select></label>
      </div>
      {personalOnly?<div className="modal-preview"><span>الموعد</span><strong>{form.title||"بدون عنوان"}</strong><small>{teacherTimezone} · {formatTime12(form.time)} – {formatTime12(endTime(form.time,form.duration))}</small></div>:<div className="modal-preview"><span>توقيت الطالب المتوقع</span><strong>{(() => { const s=students.find(x=>x.id===form.studentId); return s?formatTime12(zonedParts(teacherWallClockToUtc(form.date,form.time,teacherTimezone).toISOString(),s.timezone).time):"—"; })()}</strong><small>{(() => { const s=students.find(x=>x.id===form.studentId); return s?countryName(s.country_code||"")+" · "+s.timezone+" · نهاية الموعد "+formatTime12(endTime(form.time,form.duration))+" بتوقيت المعلم":"اختر طالبًا"; })()}</small></div>}
      <footer><button className="cancel" onClick={()=>setModalOpen(false)}>إلغاء</button><button className="save" onClick={saveAppointment} disabled={loading||(!personalOnly&&students.length===0)}><Check size={17}/> حفظ الموعد</button></footer>
    </section></div>}
  </main>;
}