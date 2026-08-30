"use client";

import { useMemo, useState } from "react";
import {
  Bell, BookMarked, BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft,
  ClipboardCheck, Clock3, GraduationCap, LayoutDashboard, Menu, Plus, Search,
  Settings, UserPlus, Users, Wallet, X, Languages, Copy, FileText, RotateCcw
} from "lucide-react";

type Student = { id:number; name:string; age:number; country:string; subjects:string[]; progress:number; next:string; hours:number; status:"نشط"|"متوقف" };
type Lesson = { id:number; time:string; student:string; meta:string; type:"student"|"personal"; status:"قادم"|"شخصي"|"تعويض" };

const initialStudents:Student[] = [
  {id:1,name:"أحمد",age:10,country:"بلجيكا",subjects:["قرآن","قراءة"],progress:80,next:"اليوم · 14:00",hours:8,status:"نشط"},
  {id:2,name:"فاضل",age:11,country:"بلجيكا",subjects:["عربية","قرآن"],progress:60,next:"اليوم · 16:00",hours:6,status:"نشط"},
  {id:3,name:"محمد",age:9,country:"فرنسا",subjects:["عربية","قراءة"],progress:41,next:"الثلاثاء · 18:00",hours:10,status:"نشط"},
];

const initialLessons:Lesson[] = [
  {id:1,time:"14:00",student:"أحمد",meta:"قرآن + قراءة · 60 دقيقة",type:"student",status:"قادم"},
  {id:2,time:"16:00",student:"فاضل",meta:"عربية + قرآن · 60 دقيقة",type:"student",status:"قادم"},
  {id:3,time:"18:00",student:"حفظ شخصي",meta:"سورة النبأ · 45 دقيقة",type:"personal",status:"شخصي"},
  {id:4,time:"20:00",student:"درس خاص بك",meta:"طلب علم · 60 دقيقة",type:"personal",status:"شخصي"},
];

const nav = [
  ["الرئيسية", LayoutDashboard], ["التقويم", CalendarDays], ["الطلاب", Users],
  ["المسارات التعليمية", BookOpen], ["القرآن", BookMarked], ["الاختبارات", ClipboardCheck],
  ["جدولي الشخصي", Clock3], ["الساعات", Clock3], ["المدفوعات", Wallet],
  ["التقارير", FileText], ["التنبيهات", Bell], ["الإعدادات", Settings],
] as const;

export default function Home() {
  const [active, setActive] = useState("الرئيسية");
  const [students, setStudents] = useState(initialStudents);
  const [lessons, setLessons] = useState(initialLessons);
  const [modal, setModal] = useState<"student"|"event"|"report"|null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => students.filter(s => s.name.includes(query) || s.country.includes(query)), [students, query]);
  const notify = (message:string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  function addStudent(form:HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    if (!name) return;
    const student:Student = {
      id:Date.now(), name, age:Number(data.get("age") || 0), country:String(data.get("country") || ""),
      subjects:String(data.get("subjects") || "").split(",").map(x=>x.trim()).filter(Boolean), progress:0,
      next:"لم يحدد", hours:Number(data.get("hours") || 0), status:"نشط"
    };
    setStudents(x=>[student,...x]); setModal(null); notify("تمت إضافة الطالب بنجاح");
  }

  function saveEvent(form:HTMLFormElement) {
    const data = new FormData(form);
    const title = String(data.get("title") || "موعد شخصي");
    const time = String(data.get("time") || "");
    const duration = String(data.get("duration") || "60");
    setLessons(x=>[...x,{id:Date.now(),time,student:title,meta:`موعد شخصي · ${duration} دقيقة`,type:"personal",status:"شخصي"}]);
    setModal(null); notify("تمت إضافة الموعد إلى جدولك");
  }

  function finishLesson(student:string) {
    setModal("report");
    notify(`تم فتح تقرير حصة ${student}`);
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><GraduationCap size={21}/></div><div>Ustadh Manager<small>إدارة التدريس والطلاب</small></div></div>
      <nav className="nav">{nav.map(([label,Icon])=><button key={label} className={active===label?"active":""} onClick={()=>setActive(label)}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-foot"><div className="avatar">هـ</div><div><b>الأستاذ</b><small>حساب المدرس</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setActive("الرئيسية")}><Menu size={21}/></button><div><div className="eyebrow">الأحد، 30 أغسطس 2026</div><h1>{active}</h1></div><div className="top-actions"><button className="icon-btn" onClick={()=>notify("لا توجد تنبيهات جديدة") }><Bell size={18}/></button><button className="primary-btn" onClick={()=>setModal("student")}><UserPlus size={17}/> طالب جديد</button></div></header>

      {active === "الرئيسية" && <>
        <section className="hero"><div><span className="eyebrow">صباح الخير 👋</span><h2>إليك نظرة سريعة على يومك وعملك.</h2><p>تابع حصصك، طلابك، وتقاريرك من مكان واحد.</p></div><button className="outline-btn" onClick={()=>setActive("التقويم")}><CalendarDays size={17}/> فتح التقويم</button></section>
        <section className="stats grid4">
          <Stat icon={<Clock3/>} label="ساعات التدريس هذا الشهر" value="42 ساعة" note="من 46 ساعة متفق عليها"/>
          <Stat icon={<Users/>} label="الطلاب النشطون" value={String(students.filter(s=>s.status==="نشط").length)} note="جميع الطلاب الحاليين"/>
          <Stat icon={<CalendarDays/>} label="الساعات المتاحة" value="6 ساعات" note="للطلبة الجدد"/>
          <Stat icon={<ClipboardCheck/>} label="الاختبارات القادمة" value="3" note="أقربها غدًا"/>
        </section>
        <section className="grid main-grid">
          <div className="card"><SectionTitle title="جدول اليوم" action="التقويم" onClick={()=>setActive("التقويم")}/>{lessons.map(x=><div className="event" key={x.id}><div className="time">{x.time}</div><div className={x.type==="personal"?"dot personal":"dot"}/><div className="event-main"><b>{x.student}</b><span>{x.meta}</span></div><span className="pill">{x.status}</span>{x.type==="student"&&<button className="mini-btn" onClick={()=>finishLesson(x.student)}>إنهاء</button>}</div>)}</div>
          <div className="card"><SectionTitle title="تنبيهات ومهام"/><Notice icon="🔔" title="بعد 30 دقيقة" text="حصة أحمد — قرآن + قراءة"/><Notice icon="📝" title="اختبار قادم" text="فاضل — اختبار جزء عم غدًا"/><Notice icon="🟡" title="تعويض معلّق" text="محمد لديه حصة مؤجلة بانتظار الاتفاق"/><Notice icon="✓" title="وقت متاح" text="الأحد 19:00–20:00 لاستقبال طالب جديد"/></div>
        </section>
        <section className="grid main-grid">
          <div className="card"><SectionTitle title="متابعة الطلاب" action="كل الطلاب" onClick={()=>setActive("الطلاب")}/>{students.slice(0,3).map(s=><StudentRow key={s.id} student={s}/>)}</div>
          <div className="card"><SectionTitle title="ساعات الشهر"/><div className="big-number">42:00</div><div className="eyebrow">إجمالي التدريس</div><div className="meter"><span style={{width:"91%"}}/></div><div className="split"><span>المتفق <b>46 ساعة</b></span><span>المتبقي <b>4 ساعات</b></span></div></div>
        </section>
      </>}

      {active === "الطلاب" && <StudentsPage students={filtered} query={query} setQuery={setQuery} onAdd={()=>setModal("student")} onReport={finishLesson}/>} 
      {active === "التقويم" && <CalendarPage lessons={lessons} onAdd={()=>setModal("event")} onReport={finishLesson}/>} 
      {active !== "الرئيسية" && active !== "الطلاب" && active !== "التقويم" && <ComingSoon title={active} onAdd={active==="جدولي الشخصي"?()=>setModal("event"):undefined}/>} 
    </main>

    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    {modal === "student" && <Modal title="إضافة طالب جديد" close={()=>setModal(null)}><form className="form" onSubmit={e=>{e.preventDefault();addStudent(e.currentTarget)}}><div className="form-grid"><Field name="name" label="اسم الطالب" placeholder="مثال: أحمد" required/><Field name="age" label="العمر" type="number" placeholder="10"/><Field name="country" label="الدولة" placeholder="بلجيكا"/><Field name="hours" label="الساعات الشهرية" type="number" placeholder="8"/></div><Field name="subjects" label="المواد / المجالات" placeholder="قرآن، قراءة، عربية"/><div className="hint"><Languages size={15}/> يمكن للطالب دراسة أكثر من مجال في الحصة الواحدة.</div><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>إلغاء</button><button className="primary-btn" type="submit"><Plus size={17}/> إضافة الطالب</button></div></form></Modal>}
    {modal === "event" && <Modal title="إضافة موعد شخصي" close={()=>setModal(null)}><form className="form" onSubmit={e=>{e.preventDefault();saveEvent(e.currentTarget)}}><Field name="title" label="النشاط" placeholder="حفظ سورة النبأ / مراجعة / درس" required/><div className="form-grid"><Field name="date" label="التاريخ" type="date"/><Field name="time" label="الوقت" type="time" required/><Field name="duration" label="المدة بالدقائق" type="number" placeholder="45"/></div><label className="checkline"><input type="checkbox" defaultChecked/> تذكير قبل الموعد بـ30 دقيقة</label><div className="hint">لن يغير هذا الموعد جدول الطلاب، لكنه سيُحسب ضمن أوقاتك المشغولة لمنع التعارض.</div><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>إلغاء</button><button className="primary-btn" type="submit">حفظ الموعد</button></div></form></Modal>}
    {modal === "report" && <LessonReport close={()=>setModal(null)} notify={notify}/>} 
  </div>
}

function Stat({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}){return <div className="card stat"><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function SectionTitle({title,action,onClick}:{title:string;action?:string;onClick?:()=>void}){return <div className="section-title"><b>{title}</b>{action&&<button onClick={onClick}>{action}<ChevronLeft size={14}/></button>}</div>}
function Notice({icon,title,text}:{icon:string;title:string;text:string}){return <div className="notice"><span className="notice-icon">{icon}</span><div><b>{title}</b><span>{text}</span></div></div>}
function StudentRow({student:s}:{student:Student}){return <div className="student-row"><div className="avatar sm">{s.name[0]}</div><div className="student-info"><b>{s.name}</b><span>{s.subjects.join(" + ")} · {s.country}</span><div className="meter"><span style={{width:`${s.progress}%`}}/></div></div><strong>{s.progress}%</strong></div>}
function Field({name,label,placeholder,type="text",required=false}:{name:string;label:string;placeholder?:string;type?:string;required?:boolean}){return <label className="field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required={required}/></label>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="overlay"><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={close}><X size={18}/></button></div>{children}</div></div>}
function StudentsPage({students,query,setQuery,onAdd,onReport}:{students:Student[];query:string;setQuery:(v:string)=>void;onAdd:()=>void;onReport:(name:string)=>void}){return <section><div className="page-actions"><div><p className="eyebrow">إدارة الطلاب ومتابعة تقدمهم</p><h2>الطلاب</h2></div><button className="primary-btn" onClick={onAdd}><UserPlus size={17}/> طالب جديد</button></div><div className="card search-card"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث بالاسم أو الدولة..."/></div><div className="student-grid">{students.map(s=><div className="card student-card" key={s.id}><div className="student-card-head"><div className="avatar">{s.name[0]}</div><div><h3>{s.name}</h3><span>{s.age} سنة · {s.country}</span></div><span className="status">{s.status}</span></div><div className="chips">{s.subjects.map(x=><span key={x}>{x}</span>)}</div><div className="student-meta"><span>الساعات الشهرية</span><b>{s.hours} ساعات</b></div><div className="student-meta"><span>التقدم العام</span><b>{s.progress}%</b></div><div className="meter"><span style={{width:`${s.progress}%`}}/></div><div className="student-next">الحصة القادمة: <b>{s.next}</b></div><button className="outline-btn full" onClick={()=>onReport(s.name)}><FileText size={16}/> تقرير حصة</button></div>)}</div></section>}
function CalendarPage({lessons,onAdd,onReport}:{lessons:Lesson[];onAdd:()=>void;onReport:(name:string)=>void}){return <section><div className="page-actions"><div><p className="eyebrow">الأسبوع الحالي · التوقيت المحلي</p><h2>التقويم</h2></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> موعد شخصي</button></div><div className="calendar-head"><button className="outline-btn">اليوم</button><div><button className="icon-btn"><ChevronLeft/></button><b>30 أغسطس – 5 سبتمبر</b><button className="icon-btn"><ChevronLeft style={{transform:"rotate(180deg)"}}/></button></div></div><div className="calendar card">{lessons.map(x=><div className="calendar-event" key={x.id}><div className="cal-time">{x.time}</div><div className="cal-line"><span/></div><div className="cal-body"><b>{x.student}</b><span>{x.meta}</span></div><span className="pill">{x.status}</span>{x.type==="student"&&<button className="mini-btn" onClick={()=>onReport(x.student)}>إنهاء الحصة</button>}</div>)}</div><div className="availability card"><div><b>🟢 الوقت المتاح لاستقبال طلاب جدد</b><span>بعد خصم حصص الطلاب والتزاماتك الشخصية</span></div><div className="slots"><span>الأحد 19:00–20:00</span><span>الثلاثاء 20:00–22:00</span><span>الخميس 17:00–19:00</span></div></div></section>}
function ComingSoon({title,onAdd}:{title:string;onAdd?:()=>void}){return <section className="empty card"><div className="empty-icon"><CheckCircle2 size={26}/></div><h2>{title}</h2><p>هذا القسم مهيأ في الهيكل الأساسي للتطبيق، وسيتم ربطه بالبيانات والوظائف المتخصصة.</p>{onAdd&&<button className="primary-btn" onClick={onAdd}><Plus size={17}/> إضافة نشاط</button>}</section>}
function LessonReport({close,notify}:{close:()=>void;notify:(x:string)=>void}){const [text,setText]=useState("");const [homework,setHomework]=useState("");const [next,setNext]=useState("");const [lang,setLang]=useState("ar");const generated=lang==="fr"?`Rapport de cours\n\nAujourd’hui, nous avons travaillé sur :\n${text||"À compléter"}\n\nDevoir :\n${homework||"À compléter"}\n\nProchain cours :\n${next||"À définir"}`:lang==="en"?`Lesson Report\n\nToday we worked on:\n${text||"To be completed"}\n\nHomework:\n${homework||"To be completed"}\n\nNext lesson:\n${next||"To be defined"}`:`تقرير الحصة\n\nما تم في الحصة:\n${text||"يُستكمل"}\n\nالواجب:\n${homework||"يُستكمل"}\n\nالحصة القادمة:\n${next||"يُحدد لاحقًا"}`;return <div className="overlay"><div className="modal report-modal"><div className="modal-head"><h3>تقرير الحصة</h3><button className="icon-btn" onClick={close}><X size={18}/></button></div><div className="form"><Field name="lesson" label="المراجعة وما تم تدريسه" placeholder="مثال: مراجعة سورة الملك 1–10 ثم حفظ 11–15..."/><label className="field"><span>ما تم في الحصة</span><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="اكتب بالتفصيل ما تم تدريسه..."/></label><label className="field"><span>الواجب</span><textarea value={homework} onChange={e=>setHomework(e.target.value)} placeholder="اكتب الواجب المطلوب..."/></label><label className="field"><span>الحصة القادمة</span><input value={next} onChange={e=>setNext(e.target.value)} placeholder="ماذا تريد أن تفعل في الحصة القادمة؟"/></label><div className="language-row"><span>لغة التقرير</span>{[["ar","العربية"],["fr","Français"],["en","English"]].map(([v,l])=><button key={v} className={lang===v?"selected":""} onClick={()=>setLang(v)}>{l}</button>)}</div><div className="preview"><div className="preview-head"><b>معاينة التقرير</b><button className="mini-btn" onClick={()=>{navigator.clipboard?.writeText(generated);notify("تم نسخ التقرير");}}><Copy size={14}/> نسخ</button></div><pre>{generated}</pre></div><div className="modal-actions"><button className="outline-btn" onClick={close}>حفظ لاحقًا</button><button className="primary-btn" onClick={()=>{notify("تم حفظ تقرير الحصة");close()}}><Check size={17}/> إنهاء وحفظ التقرير</button></div></div></div></div>}
