"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, AlertTriangle, ArrowLeftRight, ListFilter, MoreHorizontal } from "lucide-react";
import "./calendar.css";

type ViewMode = "month" | "week" | "day";
type Appointment = { id:number; day:number; time:string; end:string; student:string; country:string; subject:string; duration:number; status:string };

const days = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const appointments: Appointment[] = [
  {id:1,day:0,time:"09:00",end:"09:45",student:"هارون",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:2,day:0,time:"14:00",end:"15:00",student:"ريان",country:"🇧🇪 بلجيكا",subject:"العربية",duration:60,status:"مؤكد"},
  {id:3,day:0,time:"18:00",end:"18:45",student:"فاضل",country:"🇫🇷 فرنسا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:4,day:1,time:"10:00",end:"10:45",student:"ماهر",country:"🇫🇷 فرنسا",subject:"العربية",duration:45,status:"مؤكد"},
  {id:5,day:1,time:"18:30",end:"19:30",student:"هارون",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:60,status:"مؤكد"},
  {id:6,day:2,time:"09:00",end:"09:45",student:"ريان",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:7,day:2,time:"16:00",end:"16:45",student:"فاضل",country:"🇫🇷 فرنسا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:8,day:2,time:"19:00",end:"19:45",student:"ماهر",country:"🇫🇷 فرنسا",subject:"العربية",duration:45,status:"مؤكد"},
  {id:9,day:3,time:"14:00",end:"15:00",student:"هارون",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:60,status:"مؤكد"},
  {id:10,day:3,time:"18:00",end:"18:45",student:"ريان",country:"🇧🇪 بلجيكا",subject:"العربية",duration:45,status:"مؤكد"},
  {id:11,day:4,time:"10:00",end:"10:45",student:"فاضل",country:"🇫🇷 فرنسا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:12,day:4,time:"16:00",end:"17:00",student:"ماهر",country:"🇫🇷 فرنسا",subject:"العربية",duration:60,status:"مؤكد"},
  {id:13,day:4,time:"19:00",end:"19:45",student:"هارون",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:14,day:6,time:"11:00",end:"11:45",student:"ريان",country:"🇧🇪 بلجيكا",subject:"القرآن الكريم",duration:45,status:"مؤكد"},
  {id:15,day:6,time:"18:00",end:"19:00",student:"فاضل",country:"🇫🇷 فرنسا",subject:"القرآن الكريم",duration:60,status:"مؤكد"},
];

const monthDays = Array.from({length:30}, (_,i)=>i+1);
const offset = 2;

function localTime(time:string, country:string){
  const [h,m]=time.split(":").map(Number);
  const delta = country.includes("فرنسا") ? 1 : 2;
  const total = h*60+m-delta*60;
  const hh = Math.floor((total+1440)%1440/60).toString().padStart(2,"0");
  const mm = (total+1440)%60;
  return `${hh}:${mm.toString().padStart(2,"0")}`;
}

export default function CalendarPage(){
  const [view,setView]=useState<ViewMode>("week");
  const [selectedDay,setSelectedDay]=useState(0);
  const [selectedCountry,setSelectedCountry]=useState("🇧🇪 بلجيكا");
  const [converterTime,setConverterTime]=useState("18:00");
  const [month,setMonth]=useState(8);
  const [conflicts,setConflicts]=useState(true);

  const totalHours = useMemo(()=>appointments.reduce((a,b)=>a+b.duration,0)/60,[appointments]);
  const weekCount = appointments.length;
  const dayAppointments = appointments.filter(a=>a.day===selectedDay);
  const selectedStudent = appointments.find(a=>a.country===selectedCountry);

  return <main className="calendar-shell" dir="rtl">
    <header className="calendar-header">
      <div><span className="calendar-eyebrow">إدارة المواعيد</span><h1>التقويم والمواعيد</h1><p>نظرة واضحة على جدول الحلقات مع التوقيت المحلي لكل طالب.</p></div>
      <button className="add-appointment"><Plus size={18}/> إضافة موعد</button>
    </header>

    <section className="timezone-card">
      <div className="timezone-title"><span className="timezone-icon"><ArrowLeftRight size={18}/></span><div><h2>محول فروق التوقيت المباشر</h2><p>حوّل الموعد فورياً بين توقيتك في مصر وتوقيت الطالب.</p></div></div>
      <div className="timezone-controls">
        <label>الطالب / البلد<select value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value)}><option>🇧🇪 بلجيكا</option><option>🇫🇷 فرنسا</option></select></label>
        <label>توقيت مصر<input type="time" value={converterTime} onChange={e=>setConverterTime(e.target.value)}/></label>
        <div className="timezone-result"><span>التوقيت المحلي للطالب</span><strong>{localTime(converterTime,selectedCountry)}</strong><small>{selectedStudent?.country || selectedCountry} · فرق التوقيت محسوب تلقائياً</small></div>
      </div>
    </section>

    {conflicts && <button className="conflict-alert" onClick={()=>setConflicts(false)}><span><AlertTriangle size={19}/></span><div><strong>تم اكتشاف 2 تعارض في جدول المواعيد!</strong><small>راجع المواعيد المتداخلة قبل اعتماد الجدول.</small></div><ChevronLeft size={18}/></button>}

    <section className="calendar-toolbar">
      <div className="view-switch"><button className={view==="month"?"active":""} onClick={()=>setView("month")}>الشهر</button><button className={view==="week"?"active":""} onClick={()=>setView("week")}>الأسبوع</button><button className={view==="day"?"active":""} onClick={()=>setView("day")}>اليوم</button></div>
      <div className="date-nav"><button aria-label="التالي"><ChevronRight size={17}/></button><strong>{view==="month"?"سبتمبر ٢٠٢٦":view==="day"?days[selectedDay]:"١ - ٧ سبتمبر ٢٠٢٦"}</strong><button aria-label="السابق"><ChevronLeft size={17}/></button><button className="today-button">اليوم</button></div>
      <button className="filter-button"><ListFilter size={17}/> تصفية</button>
    </section>

    {view==="month" && <section className="month-calendar"><div className="month-weekdays">{days.map(d=><span key={d}>{d}</span>)}</div><div className="month-grid">{Array.from({length:offset}).map((_,i)=><div className="month-empty" key={`e${i}`}/>) }{monthDays.map(day=>{const dayIndex=(day+offset-1)%7;const items=appointments.filter(a=>a.day===dayIndex).slice(0,3);return <button className={`month-day ${day===5?"current":""}`} key={day}><b>{day}</b>{items.map(a=><span key={a.id}><i/>{a.time} · {a.student}</span>)}{items.length>0&&<small>{items.length} موعد</small>}</button>})}</div></section>}

    {view!=="month" && <>
      <section className="week-summary"><div><span>المواعيد الأسبوعية</span><strong>{weekCount} <em>موعدًا</em></strong></div><div><span>إجمالي الساعات</span><strong>{totalHours.toFixed(1)} <em>ساعة</em></strong></div><div className="summary-days">{days.map((d,i)=><button key={d} onClick={()=>setSelectedDay(i)} className={selectedDay===i?"selected":""}><b>{appointments.filter(a=>a.day===i).length}</b><span>{d}</span></button>)}</div></section>
      {view==="week" && <section className="week-grid">{days.map((d,i)=><div className={`day-column ${selectedDay===i?"selected":""}`} key={d}><button className="day-heading" onClick={()=>{setSelectedDay(i);setView("day")}}><span>{d}</span><strong>{appointments.filter(a=>a.day===i).length}</strong></button><div className="day-list">{appointments.filter(a=>a.day===i).map(a=><article className="appointment-card" key={a.id}><div className="appointment-time"><strong>{a.time}</strong><span>{localTime(a.time,a.country)} محلي</span></div><div className="appointment-main"><h3>{a.student}</h3><p>{a.subject}</p><small>{a.country} · {a.duration} دقيقة</small></div><button className="more"><MoreHorizontal size={17}/></button></article>)}</div><button className="column-add"><Plus size={15}/> إضافة</button></div>)}</section>}
      {view==="day" && <section className="day-view"><div className="day-view-head"><div><span>الجدول اليومي</span><h2>{days[selectedDay]} · ٥ سبتمبر</h2></div><span className="day-count">{dayAppointments.length} مواعيد</span></div>{dayAppointments.length?dayAppointments.map(a=><article className="detail-appointment" key={a.id}><div className="detail-time"><strong>{a.time}</strong><span>{a.end}</span></div><div className="detail-line"/><div className="detail-info"><h3>{a.student}</h3><p>{a.subject} · {a.country}</p><span><Clock3 size={14}/> توقيت الطالب: {localTime(a.time,a.country)}</span></div><span className="status">{a.status}</span><button className="more"><MoreHorizontal size={18}/></button></article>):<div className="empty-day">لا توجد مواعيد في هذا اليوم.</div>}</section>}
    </>}

    <footer className="calendar-footer"><span><Clock3 size={15}/> جميع الأوقات الأساسية معروضة بتوقيت مصر (Africa/Cairo)</span><span>آخر تحديث للجدول: الآن</span></footer>
  </main>
}
