"use client";

import { useEffect, useMemo, useState } from "react";
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
  hours:{title:"متابعة الساعات",subtitle:"تابع الساعات الشهرية والحصص المنجزة لكل طالب في مكان واحد.",primary:"تسجيل حصة",tabs:["نظرة عامة","ساعات الطلاب","السجل الشهري"],stats:["إجمالي الساعات","الساعات المنجزة","الساعات المتبقية","الطلاب"],columns:["الطالب","المقرر","الساعات","الإنجاز"],seed:[]},
  payments:{title:"المدفوعات",subtitle:"إدارة الحسابات والدفعات الشهرية وحالة كل طالب أو مركز.",primary:"تسجيل دفعة",tabs:["المدفوعات","الحسابات","الملخص"],stats:["إجمالي المدفوع","المستحق","دفعات الشهر","حسابات معلقة"],columns:["الطالب / الجهة","المبلغ","التاريخ","الحالة"],seed:[]},
  exams:{title:"الاختبارات والتقييم",subtitle:"أنشئ التقييمات واربطها بالطلاب وسجّل النتائج مع الاحتفاظ بالسجل.",primary:"إنشاء اختبار",tabs:["الاختبارات","النتائج","بنك التقييم"],stats:["اختبارات نشطة","نتائج مسجلة","متوسط النجاح","تحتاج مراجعة"],columns:["الاختبار","الطالب","النتيجة","الحالة"],seed:[]},
  paths:{title:"المسارات التعليمية",subtitle:"نظّم المواد والمراحل واربط كل طالب بمساره التعليمي.",primary:"إضافة مسار",tabs:["المسارات","المواد","المراحل"],stats:["مسارات نشطة","المواد","الطلاب المرتبطون","المراحل المكتملة"],columns:["المسار","الوصف","الطلاب","الحالة"],seed:[{id:"path-quran",title:"القرآن الكريم",subtitle:"حفظ ومراجعة وتلاوة",status:"نشط",value:"0 طلاب"},{id:"path-arabic",title:"اللغة العربية",subtitle:"قراءة ونحو ومفردات",status:"نشط",value:"0 طلاب"}]},
  reports:{title:"التقارير",subtitle:"أنشئ تقارير الحصص والساعات والطلاب مع إمكانية الطباعة والمشاركة.",primary:"إنشاء تقرير",tabs:["تقارير الطلاب","تقارير الحصص","تقارير المراكز"],stats:["تقارير الشهر","جاهزة للإرسال","مسودات","تمت مشاركتها"],columns:["التقرير","الطالب / الجهة","الفترة","الحالة"],seed:[]},
  alerts:{title:"التنبيهات والتذكيرات",subtitle:"نظّم تذكيرات الحصص والمراجعات والمهام الشخصية.",primary:"إضافة تنبيه",tabs:["التنبيهات","القادمة","السجل"],stats:["تنبيهات نشطة","اليوم","تمت قراءتها","مؤجلة"],columns:["التنبيه","الموعد","النوع","الحالة"],seed:[]},
  settings:{title:"الإعدادات",subtitle:"إدارة إعدادات الحساب واللغة والمنطقة الزمنية والتنبيهات.",primary:"حفظ التغييرات",tabs:["الحساب","التفضيلات","التنبيهات"],stats:["اللغة","المنطقة الزمنية","التذكيرات","الحساب"],columns:["الإعداد","القيمة","الوصف","الحالة"],seed:[{id:"language",title:"لغة الواجهة",subtitle:"اللغة الأساسية للتطبيق",status:"مفعل",value:"العربية"},{id:"timezone",title:"المنطقة الزمنية",subtitle:"تستخدم لحساب مواعيد الحصص",status:"مفعل",value:"Africa/Cairo"},{id:"reminder",title:"التذكير قبل الحصة",subtitle:"الإشعار التلقائي",status:"مفعل",value:"30 دقيقة"}]},
  "my-calendar":{title:"جدولي الشخصي",subtitle:"أضف مواعيدك الشخصية ومهام الحفظ والمراجعة بجانب حصص الطلاب.",primary:"إضافة موعد",tabs:["اليوم","الأسبوع","المواعيد الشخصية"],stats:["مواعيد اليوم","هذا الأسبوع","وقت متاح","تذكيرات"],columns:["الموعد","التاريخ","الوقت","الحالة"],seed:[]},
  lessons:{title:"الحصص",subtitle:"سجل الحصص القادمة والمنجزة واربط كل حصة بالطالب والساعات والتقرير.",primary:"تسجيل حصة",tabs:["القادمة","المنجزة","السجل"],stats:["حصص اليوم","هذا الأسبوع","منجزة","معلقة"],columns:["الحصة","الطالب","التاريخ","الحالة"],seed:[]}
};

const STORAGE_PREFIX="riwaq:module:";
const read=(kind:Kind,seed:Row[])=>{try{const raw=localStorage.getItem(STORAGE_PREFIX+kind);return raw?JSON.parse(raw):seed}catch{return seed}};
const save=(kind:Kind,rows:Row[])=>localStorage.setItem(STORAGE_PREFIX+kind,JSON.stringify(rows));

export default function ManagementModule({kind}:{kind:Kind}){
  const c=config[kind], Icon=icons[kind];
  const [rows,setRows]=useState<Row[]>([]),[query,setQuery]=useState(""),[tab,setTab]=useState(0);
  const [open,setOpen]=useState(false),[editing,setEditing]=useState<Row|null>(null),[notice,setNotice]=useState("");
  const [form,setForm]=useState({title:"",subtitle:"",status:"نشط",value:"",date:"",extra:""});

  useEffect(()=>setRows(read(kind,c.seed)),[kind,c.seed]);
  useEffect(()=>{if(rows.length)save(kind,rows)},[rows,kind]);
  const filtered=useMemo(()=>rows.filter(r=>`${r.title} ${r.subtitle} ${r.value||""}`.toLowerCase().includes(query.trim().toLowerCase())),[rows,query]);

  const metrics=useMemo(()=>{
    if(kind==="hours"){
      const total=rows.reduce((n,r)=>n+(Number(r.value)||0),0);
      return [`${total.toFixed(1)} ساعة`,`${total.toFixed(1)} ساعة`,"—",`${rows.length}`];
    }
    if(kind==="payments") return ["0","0","0",`${rows.filter(r=>r.status.includes("معلق")).length}`];
    if(kind==="exams") return [`${rows.length}`,"0","0%","0"];
    if(kind==="reports") return [`${rows.length}`,`${rows.filter(r=>r.status.includes("جاهز")).length}`,`${rows.filter(r=>r.status.includes("مسودة")).length}`,"0"];
    if(kind==="alerts") return [`${rows.filter(r=>r.status.includes("نشط")).length}`,"0","0","0"];
    if(kind==="lessons") return ["0","0",`${rows.filter(r=>r.status.includes("منجز")).length}`,`${rows.filter(r=>r.status.includes("معلق")).length}`];
    if(kind==="my-calendar") return ["0","0","—","0"];
    if(kind==="paths") return [`${rows.filter(r=>r.status.includes("نشط")).length}`,`${rows.length}`,"0","0"];
    return ["العربية","Africa/Cairo","30 دقيقة","نشط"];
  },[kind,rows]);

  const start=(row?:Row)=>{
    setEditing(row||null);
    setForm(row?{title:row.title,subtitle:row.subtitle,status:row.status,value:row.value||"",date:row.date||"",extra:row.extra||""}:{title:"",subtitle:"",status:kind==="settings"?"مفعل":"نشط",value:"",date:"",extra:""});
    setOpen(true);setNotice("");
  };
  const close=()=>{setOpen(false);setEditing(null)};
  const submit=()=>{
    if(kind==="settings" && !editing){close();setNotice("تم حفظ الإعدادات");return}
    if(!form.title.trim()) return setNotice("اكتب عنوانًا أولًا.");
    const next:Row={id:editing?.id||crypto.randomUUID(),title:form.title.trim(),subtitle:form.subtitle.trim()||"بدون وصف",status:form.status,value:form.value||undefined,date:form.date||undefined,extra:form.extra||undefined};
    setRows(prev=>editing?prev.map(r=>r.id===editing.id?next:r):[next,...prev]);
    close();setNotice(editing?"تم تحديث العنصر بنجاح.":"تمت الإضافة بنجاح.");
  };
  const remove=(id:string)=>{if(confirm("هل تريد حذف هذا العنصر؟")){setRows(v=>v.filter(x=>x.id!==id));setNotice("تم حذف العنصر.")}};
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
      {filtered.length===0?<div className="management-empty"><div><Icon size={28}/></div><h3>لا توجد بيانات بعد</h3><p>ابدأ بإضافة أول عنصر من الزر الموجود أعلى الصفحة، وسيظهر هنا مباشرة.</p><button className="primary-button" onClick={()=>start()}><Plus size={16}/> {c.primary}</button></div>:
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
