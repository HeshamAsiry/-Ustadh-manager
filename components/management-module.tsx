"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Bell, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ClipboardList,
  Clock3, CreditCard, FileText, GraduationCap, Plus, Search, Settings2,
  Trash2, UserRound, X, Pencil, Download, Filter, MoreHorizontal
} from "lucide-react";
import "../app/management-pages.css";

type Kind = "hours" | "payments" | "exams" | "paths" | "reports" | "alerts" | "settings" | "my-calendar" | "lessons";
type Row = { id:string; title:string; subtitle:string; status:string; value?:string; date?:string; extra?:string };

const icons = { hours: Clock3, payments: CreditCard, exams: GraduationCap, paths: BookOpen, reports: FileText, alerts: Bell, settings: Settings2, "my-calendar": CalendarDays, lessons: ClipboardList };

const config: Record<Kind,{title:string;subtitle:string;primary:string;tabs:string[];stats:string[];columns:string[];seed:Row[]}> = {
  hours:{title:"متابعة الساعات",subtitle:"تابع الساعات الشهرية والحصص المنجزة لكل طالب في مكان واحد.",primary:"تسجيل حصة",tabs:["نظرة عامة","ساعات الطلاب","السجل الشهري"],stats:["الساعات المقررة","الساعات المنجزة","الساعات المتبقية","الطلاب"],columns:["الطالب","المقرر","الساعات","الإنجاز"],seed:[]},
  payments:{title:"المدفوعات",subtitle:"إدارة الحسابات والدفعات الشهرية وحالة كل طالب أو مركز.",primary:"تسجيل دفعة",tabs:["المدفوعات","الحسابات","الملخص"],stats:["إجمالي المدفوع","المستحق","دفعات الشهر","حسابات معلقة"],columns:["الطالب / الجهة","المبلغ","التاريخ","الحالة"],seed:[]},
  exams:{title:"الاختبارات والتقييم",subtitle:"أنشئ التقييمات واربطها بالطلاب وسجّل النتائج مع الاحتفاظ بالسجل.",primary:"إنشاء اختبار",tabs:["الاختبارات","النتائج","بنك التقييم"],stats:["اختبارات نشطة","نتائج مسجلة","متوسط النجاح","تحتاج مراجعة"],columns:["الاختبار","الطالب","النتيجة","الحالة"],seed:[]},
  paths:{title:"المسارات التعليمية",subtitle:"نظّم المواد والمراحل واربط كل طالب بمساره التعليمي.",primary:"إضافة مسار",tabs:["المسارات","المواد","المراحل"],stats:["مسارات نشطة","المواد","الطلاب المرتبطون","المراحل المكتملة"],columns:["المسار","الوصف","الطلاب","الحالة"],seed:[{id:"path-quran",title:"القرآن الكريم",subtitle:"حفظ ومراجعة وتلاوة",status:"نشط",value:"0 طلاب"},{id:"path-arabic",title:"اللغة العربية",subtitle:"قراءة ونحو ومفردات",status:"نشط",value:"0 طلاب"}]},
  reports:{title:"التقارير",subtitle:"أنشئ تقارير الحصص والساعات والطلاب مع إمكانية الطباعة والمشاركة.",primary:"إنشاء تقرير",tabs:["تقارير الطلاب","تقارير الحصص","تقارير المراكز"],stats:["تقارير الشهر","جاهزة للإرسال","مسودات","تمت مشاركتها"],columns:["التقرير","الطالب / الجهة","الفترة","الحالة"],seed:[]},
  alerts:{title:"التنبيهات والتذكيرات",subtitle:"نظّم تذكيرات الحصص والمراجعات والمهام الشخصية.",primary:"إضافة تنبيه",tabs:["التنبيهات","القادمة","السجل"],stats:["تنبيهات نشطة","اليوم","تمت قراءتها","مؤجلة"],columns:["التنبيه","الموعد","النوع","الحالة"],seed:[]},
  settings:{title:"الإعدادات",subtitle:"إدارة إعدادات الحساب واللغة والمنطقة الزمنية والتنبيهات.",primary:"حفظ التغييرات",tabs:["الحساب","التفضيلات","التنبيهات"],stats:["اللغة","المنطقة الزمنية","التذكيرات","الحساب"],columns:["الإعداد","القيمة","الوصف","الحالة"],seed:[{id:"language",title:"لغة الواجهة",subtitle:"اللغة الأساسية للتطبيق",status:"مفعل",value:"العربية"},{id:"timezone",title:"المنطقة الزمنية",subtitle:"تستخدم لحساب مواعيد الحصص",status:"مفعل",value:"Africa/Cairo"},{id:"reminder",title:"التذكير قبل الحصة",subtitle:"الإشعار التلقائي",status:"مفعل",value:"30 دقيقة"}]},
  "my-calendar":{title:"جدولي الشخصي",subtitle:"أضف مواعيدك الشخصية ومهام الحفظ والمراجعة بجانب حصص الطلاب.",primary:"إضافة موعد",tabs:["اليوم","الأسبوع","المواعيد الشخصية"],stats:["مواعيد اليوم","هذا الأسبوع","وقت متاح","تذكيرات"],columns:["الموعد","التاريخ","الوقت","الحالة"],seed:[]},
  lessons:{title:"الحصص",subtitle:"سجل الحصص القادمة والمنجزة واربط كل حصة بالطالب والساعات والتقرير.",primary:"تسجيل حصة",tabs:["هذا الشهر","المنجزة","السجل"],stats:["حصص الشهر","ساعات الشهر","منجزة","معلقة"],columns:["الحصة","الطالب","التاريخ","الحالة"],seed:[]}
};


const STORAGE_PREFIX="riwaq:module:";
const DB_KINDS=new Set<Kind>(["hours","lessons","reports","payments"]);
const readLocal=(kind:Kind,seed:Row[])=>{try{const raw=localStorage.getItem(STORAGE_PREFIX+kind);return raw?JSON.parse(raw):seed}catch{return seed}};
const writeCloudRows=async(kind:Kind,rows:Row[])=>{
  const {data:user}=await supabase.auth.getUser();
  if(!user.user)return;
  const current=await supabase.from("user_data").select("management_modules").eq("user_id",user.user.id).maybeSingle();
  if(current.error)return;
  const modules=current.data?.management_modules&&typeof current.data.management_modules==="object"?current.data.management_modules:{};
  await supabase.from("user_data").update({management_modules:{...modules,[kind]:rows}}).eq("user_id",user.user.id);
};


const partsInZone=(iso:string,timezone:string)=>{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
  const get=(type:string)=>parts.find(part=>part.type===type)?.value||"";
  return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
};
const wallClockToUtc=(date:string,time:string,timezone:string)=>{
  const d=date.split("-").map(Number), t=time.split(":").map(Number);
  const base=Date.UTC(d[0],d[1]-1,d[2],t[0],t[1]);
  const offsetAt=(ms:number)=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));
    const get=(x:string)=>Number(parts.find(part=>part.type===x)?.value||0);
    return Math.round((Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"))-ms)/60000);
  };
  const candidate=base-offsetAt(base)*60000;
  return new Date(base-offsetAt(candidate)*60000);
};
const parseRowJson=(value?:string)=>{try{return value?JSON.parse(value):{}}catch{return {}}};
const formatArabicDate=(iso:string,timezone:string)=>{
  const p=partsInZone(iso,timezone);
  return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(new Date(p.date+"T12:00:00"));
};


export default function ManagementModule({kind}:{kind:Kind}){
  const c=config[kind], Icon=icons[kind];
  const [rows,setRows]=useState<Row[]>([]),[query,setQuery]=useState(""),[tab,setTab]=useState(0),[loadingState,setLoadingState]=useState(true),[hydrated,setHydrated]=useState(false);
  const [open,setOpen]=useState(false),[editing,setEditing]=useState<Row|null>(null),[notice,setNotice]=useState("");
  const [form,setForm]=useState({title:"",subtitle:"",status:"نشط",value:"",date:"",extra:""});


  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      setLoadingState(true);
      setHydrated(false);
      const {data:user}=await supabase.auth.getUser();
      if(!user.user){setRows([]);setLoadingState(false);return}

      const userDataResult=await supabase.from("user_data").select("settings,management_modules").eq("user_id",user.user.id).maybeSingle();
      if(userDataResult.error){setNotice(userDataResult.error.message);setRows([]);setLoadingState(false);return}

      if(kind==="settings"){
        const settings=userDataResult.data?.settings||{};
        const settingsRows:Row[]=[
          {id:"language",title:"لغة الواجهة",subtitle:"اللغة الأساسية للتطبيق",status:"مفعل",value:String(settings.primaryLanguage||"العربية")},
          {id:"timezone",title:"المنطقة الزمنية",subtitle:"تستخدم لحساب مواعيد الحصص",status:"مفعل",value:String(settings.teacherTimeZone||settings.timezone||"Africa/Cairo")},
          {id:"reminder",title:"التذكير قبل الحصة",subtitle:"مدة التنبيه قبل الموعد",status:"مفعل",value:String(settings.notifyMinutesBefore??30)+" دقيقة"}
        ];
        if(!cancelled)setRows(settingsRows);
        if(!cancelled){setHydrated(true);setLoadingState(false)}
        return;
      }

      if(kind==="payments"){
        const {data:payments,error}=await supabase.from("payments").select("id,student_id,student_name,month_year,billing_period,amount,amount_paid,total_due,currency_code,status,payment_method,payment_date,due_date,notes,hourly_rate,agreed_hours,actual_hours,total_hours_billed,legacy_student_id").order("month_year",{ascending:false}).order("student_name");
        if(cancelled)return;
        if(error){setNotice(error.message);setRows([]);setLoadingState(false);return}
        const paymentRows=(payments||[]).map((p:any)=>({
          id:p.id,
          title:p.student_name,
          subtitle:p.month_year||p.billing_period||"بدون فترة",
          status:p.status==="paid"?"مدفوعة":p.status==="partial"?"مدفوعة جزئيًا":"غير مدفوعة",
          value:(Number(p.amount||0).toFixed(2)+" "+(p.currency_code||"")).trim(),
          date:p.payment_date||p.due_date||"",
          extra:JSON.stringify(p)
        }));
        if(!cancelled)setRows(paymentRows);
        if(!cancelled){setHydrated(true);setLoadingState(false)}
        return;
      }
      if(!DB_KINDS.has(kind)){
        const cloudModules=userDataResult.data?.management_modules;
        const cloudRows=cloudModules&&typeof cloudModules==="object"&&Array.isArray(cloudModules[kind])?cloudModules[kind]:null;
        if(cloudRows){
          if(!cancelled)setRows(cloudRows as Row[]);
        }else{
          const localRows=readLocal(kind,c.seed);
          if(!cancelled)setRows(localRows as Row[]);
          if(localRows.length){
            const modules=cloudModules&&typeof cloudModules==="object"?cloudModules:{};
            await supabase.from("user_data").update({management_modules:{...modules,[kind]:localRows}}).eq("user_id",user.user.id);
          }
        }
        if(!cancelled){setHydrated(true);setLoadingState(false)}
        return;
      }

      const timezone=userDataResult.data?.settings?.teacherTimeZone||userDataResult.data?.settings?.timezone||"Africa/Cairo";
      const now=new Date();
      const localToday=partsInZone(now.toISOString(),timezone).date;
      const monthStart=localToday.slice(0,7)+"-01";
      const nextMonth=new Date(monthStart+"T12:00:00");
      nextMonth.setMonth(nextMonth.getMonth()+1);
      const monthEnd=nextMonth.toISOString().slice(0,10);
      const startUtc=wallClockToUtc(monthStart,"00:00",timezone).toISOString();
      const endUtc=wallClockToUtc(monthEnd,"00:00",timezone).toISOString();

      const [studentsResult,eventsResult]=await Promise.all([
        supabase.from("students").select("id,full_name,monthly_hours,status,timezone,country_code").neq("status","archived").order("full_name"),
        supabase.from("events").select("id,student_id,title,starts_at,ends_at,status,event_type,notes").eq("event_type","lesson").gte("starts_at",startUtc).lt("starts_at",endUtc).order("starts_at",{ascending:false})
      ]);
      if(cancelled)return;
      if(studentsResult.error){setNotice(studentsResult.error.message);setRows([]);setLoadingState(false);return}
      if(eventsResult.error){setNotice(eventsResult.error.message);setRows([]);setLoadingState(false);return}

      const students=studentsResult.data||[];
      const events=eventsResult.data||[];
      const byStudent=Object.fromEntries(students.map(s=>[s.id,s]));
      if(kind==="hours"){
        const completed=events.filter(e=>e.status==="completed");
        const done:Record<string,number>={};
        completed.forEach(e=>{
          const h=Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);
          let ids=[e.student_id].filter(Boolean) as string[];
          try{
            const parsed=JSON.parse(e.notes||"{}");
            if(Array.isArray(parsed.participants)&&parsed.participants.length)ids=parsed.participants;
          }catch{}
          ids.forEach(id=>done[id]=(done[id]||0)+h);
        });
        setRows(students.map(s=>{
          const h=done[s.id]||0;
          const target=Number(s.monthly_hours||0);
          const pct=target?Math.min(100,h/target*100):0;
          return {id:s.id,title:s.full_name,subtitle:target+" ساعة مقررة",status:pct>=100?"مكتمل":pct>0?"قيد الإنجاز":"لم يبدأ",value:h.toFixed(1)+" / "+target.toFixed(1)+" ساعة",extra:pct.toFixed(0)+"%"};
        }));
      }else{
        setRows(events.map(e=>{
          const student=byStudent[e.student_id||""];
          let report="";
          try{report=JSON.parse(e.notes||"{}").report||""}catch{}
          const title=kind==="reports"?"تقرير — "+(student?.full_name||"طالب"):e.title;
          const status=kind==="reports"?(report.trim()?"جاهز":"مسودة"):(e.status==="completed"?"منجز":e.status==="pending"?"معلق":e.status==="cancelled"?"ملغى":"قادم");
          const hours=Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);
          return {id:e.id,title,subtitle:student?.full_name||"طالب",status,value:student?.full_name||"—",date:formatArabicDate(e.starts_at,timezone),extra:kind==="lessons"?hours.toFixed(1):(report||e.title)};
        }));
      }
      if(!cancelled){setHydrated(true);setLoadingState(false)}
    };
    void load();
    return()=>{cancelled=true};
  },[kind]);

  useEffect(()=>{
    if(DB_KINDS.has(kind)||kind==="settings"||!hydrated)return;
    void writeCloudRows(kind,rows);
  },[rows,kind,hydrated]);


  const filtered=useMemo(()=>rows.filter(r=>`${r.title} ${r.subtitle} ${r.value||""}`.toLowerCase().includes(query.trim().toLowerCase())),[rows,query]);

  const metrics=useMemo(()=>{
    if(kind==="hours"){
      const done=rows.reduce((n,r)=>n+(parseFloat(r.value||"0")||0),0);
      const target=rows.reduce((n,r)=>n+(parseFloat(r.subtitle||"0")||0),0);
      return [`${target.toFixed(1)} ساعة`,`${done.toFixed(1)} ساعة`,`${Math.max(0,target-done).toFixed(1)} ساعة`,`${rows.length}`];
    }
    if(kind==="payments") return ["0","0","0",`${rows.filter(r=>r.status.includes("معلق")).length}`];
    if(kind==="exams") return [`${rows.length}`,"0","0%","0"];
    if(kind==="reports") return [`${rows.length}`,`${rows.filter(r=>r.status.includes("جاهز")).length}`,`${rows.filter(r=>r.status.includes("مسودة")).length}`,"0"];
    if(kind==="alerts") return [`${rows.filter(r=>r.status.includes("نشط")).length}`,"0","0","0"];
    if(kind==="lessons") return [`${rows.length}`,`${rows.reduce((n,r)=>n+(parseFloat(r.extra||"0")||0),0).toFixed(1)} ساعة`,`${rows.filter(r=>r.status.includes("منجز")).length}`,`${rows.filter(r=>r.status.includes("معلق")).length}`];
    if(kind==="my-calendar") return ["0","0","—","0"];
    if(kind==="paths") return [`${rows.filter(r=>r.status.includes("نشط")).length}`,`${rows.length}`,"0","0"];
    return ["العربية","Africa/Cairo","30 دقيقة","نشط"];
  },[kind,rows]);

  const start=(row?:Row)=>{
    if(DB_KINDS.has(kind)){
      if(kind==="lessons"||kind==="hours"||kind==="reports")window.location.href="/students";
      return;
    }
    const target=kind==="settings" ? (row||rows[0]) : row;
    if(kind==="settings"&&!target){setNotice("تعذر تحميل الإعدادات.");return}
    setEditing(target||null);
    setForm(target?{title:target.title,subtitle:target.subtitle,status:target.status,value:target.value||"",date:target.date||"",extra:target.extra||""}:{title:"",subtitle:"",status:"نشط",value:"",date:"",extra:""});
    setOpen(true);setNotice("");
  };
  const close=()=>{setOpen(false);setEditing(null)};
  const submit=async()=>{
    if(kind==="settings"){
      if(!editing)return setNotice("اختر إعدادًا لتعديله.");
      const map:Record<string,string>={language:"primaryLanguage",timezone:"teacherTimeZone",reminder:"notifyMinutesBefore"};
      const settingKey=map[editing.id];
      if(!settingKey)return setNotice("الإعداد غير معروف.");
      const {data:user}=await supabase.auth.getUser();
      if(!user.user)return setNotice("انتهت جلسة الدخول.");
      const current=await supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle();
      if(current.error)return setNotice(current.error.message);
      const settings=current.data?.settings||{};
      let value=form.value.trim();
      if(editing.id==="reminder"){
        const minutes=Number.parseInt(value,10);
        if(!Number.isFinite(minutes)||minutes<0)return setNotice("اكتب مدة تذكير صحيحة بالدقائق.");
        value=String(minutes);
      }else if(!value){
        return setNotice("اكتب قيمة الإعداد.");
      }
      const nextSettings={...settings,[settingKey]:editing.id==="reminder"?Number(value):value};
      const {error}=await supabase.from("user_data").update({settings:nextSettings}).eq("user_id",user.user.id);
      if(error)return setNotice(error.message);
      setRows(prev=>prev.map(r=>r.id===editing.id?{...r,value:editing.id==="reminder"?value+" دقيقة":value}:r));
      close();
      setNotice("تم حفظ الإعداد بنجاح.");
      return;
    }
    if(!form.title.trim())return setNotice("اكتب عنوانًا أولًا.");
    const next:Row={id:editing?.id||crypto.randomUUID(),title:form.title.trim(),subtitle:form.subtitle.trim()||"بدون وصف",status:form.status,value:form.value||undefined,date:form.date||undefined,extra:form.extra||undefined};
    setRows(prev=>editing?prev.map(r=>r.id===editing.id?next:r):[next,...prev]);
    close();
    setNotice(editing?"تم تحديث العنصر بنجاح.":"تمت الإضافة بنجاح.");
  };
  const remove=(id:string)=>{
    if(DB_KINDS.has(kind)){setNotice("هذا السجل مرتبط بالحصة والطالب، ويُعدّل من صفحة الطلاب أو التقويم.");return}
    if(confirm("هل تريد حذف هذا العنصر؟")){
      setRows(v=>v.filter(x=>x.id!==id));
      setNotice("تم حذف العنصر.");
    }
  };
  const print=()=>{const w=window.open("","_blank");if(!w)return;w.document.write(`<html dir="rtl"><head><title>${c.title}</title><style>body{font-family:Arial;padding:32px;color:#28372f}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px;border:1px solid #ddd;text-align:right}h1{color:#526a58}</style></head><body><h1>رواق — ${c.title}</h1><p>${c.subtitle}</p><table><thead><tr>${c.columns.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${filtered.map(r=>`<tr><td>${r.title}</td><td>${r.subtitle}</td><td>${r.value||r.date||"—"}</td><td>${r.status}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`);w.document.close()};

  return <main className="management-page" dir="rtl">
    <section className="management-hero">
      <div><span className="eyebrow"><Icon size={14}/> إدارة رواق</span><h1>{c.title}</h1><p>{c.subtitle}</p></div>
      <div className="hero-actions"><button className="secondary-button" onClick={print}><Download size={16}/> طباعة</button><button className="primary-button management-primary" onClick={()=>start()}><Plus size={17}/>{c.primary}</button></div>
    </section>

    {notice&&<div className="management-notice"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}

    <section className="management-tabs"><div>{c.tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} className={tab===i?"active":""}>{t}</button>)}</div><span>آخر تحديث الآن</span></section>

    <section className="management-stats">{c.stats.map((label,i)=><article key={label} className={i===0?"featured":""}><span>{label}</span><strong>{metrics[i]}</strong><small>{i===0?"ملخص الفترة الحالية":"متابعة مباشرة"}</small></article>)}</section>

    <section className="management-panel">
      <header><div><span className="panel-kicker">رواق / {c.title}</span><h2>{c.tabs[tab]}</h2><p>{filtered.length} عنصر ظاهر</p></div><div className="management-tools"><label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث..."/></label><button className="secondary-button"><Filter size={15}/> تصفية <ChevronDown size={14}/></button></div></header>
      {loadingState?<div className="management-empty"><div><Icon size={28}/></div><h3>جارٍ تحميل البيانات</h3><p>يتم جلب البيانات من قاعدة البيانات...</p></div>:filtered.length===0?<div className="management-empty"><div><Icon size={28}/></div><h3>لا توجد بيانات بعد</h3><p>ابدأ بإضافة أول عنصر من الزر الموجود أعلى الصفحة، وسيظهر هنا مباشرة.</p><button className="primary-button" onClick={()=>start()}><Plus size={16}/> {c.primary}</button></div>:
      <div className="management-table-wrap"><table className="management-table"><thead><tr>{c.columns.map(x=><th key={x}>{x}</th>)}<th></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><div className="table-title"><span className="table-icon"><Icon size={16}/></span><div><strong>{r.title}</strong><small>{r.subtitle}</small></div></div></td><td>{r.value||r.extra||"—"}</td><td>{r.date||"هذا الشهر"}</td><td><span className={`management-status ${/مكتمل|منجز|جاهز|مفعل|نشط/.test(r.status)?"done":""}`}>{r.status}</span></td><td><div className="row-actions"><button onClick={()=>start(r)} title="تعديل"><Pencil size={15}/></button><button onClick={()=>remove(r.id)} title="حذف"><Trash2 size={15}/></button><button title="المزيد"><MoreHorizontal size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </section>

    {open&&<div className="management-modal-backdrop"><section className="management-modal">
      <header><div><span className="modal-icon"><Icon size={18}/></span><div><h2>{editing?"تعديل العنصر":c.primary}</h2><p>{c.title}</p></div></div><button onClick={close}><X size={19}/></button></header>
      <div className="management-form">
        <label>العنوان<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="اكتب العنوان"/></label>
        <label>التفاصيل<textarea value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} placeholder="تفاصيل إضافية"/></label>
        <div className="two-fields">
          <label>الحالة<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>نشط</option><option>قادم</option><option>مكتمل</option><option>منجز</option><option>مسودة</option><option>معلق</option><option>مفعل</option><option>جاهز</option></select></label>
          <label>{kind==="payments"?"المبلغ":"القيمة"}<input value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder={kind==="payments"?"0":"—"}/></label>
        </div>
        {(kind==="lessons"||kind==="alerts"||kind==="my-calendar"||kind==="reports")&&<label>التاريخ<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>}
        {(kind==="lessons"||kind==="reports"||kind==="exams")&&<label>ملاحظات إضافية<textarea value={form.extra} onChange={e=>setForm({...form,extra:e.target.value})}/></label>}
        {kind==="settings"&&<label>القيمة الجديدة<input value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>}
      </div>
      <footer><button onClick={close}>إلغاء</button><button className="save" onClick={submit}><CheckCircle2 size={16}/> حفظ</button></footer>
    </section></div>}
  </main>;
}