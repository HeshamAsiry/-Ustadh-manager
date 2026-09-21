"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, CalendarDays, Check, ChevronLeft, Clock3, CreditCard, FileDown, FileText, Plus, Search, Snooze, Trash2, UserRound, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { printRiwaqDocument } from "../../lib/print-document";
import "./alerts.css";

type CustomAlert={
  id:string;title:string;details:string;remindAt:string;type:string;status:"نشط"|"مقروءة"|"مؤجلة";
};
type SystemAlert={
  id:string;title:string;details:string;when:string;type:"حصة"|"دفعة";href:string;status:"نشط";
};
type FormState={title:string;details:string;date:string;time:string;type:string};

const emptyForm=():FormState=>({title:"",details:"",date:new Date().toISOString().slice(0,10),time:"18:00",type:"مهمة عامة"});
const pad=(n:number)=>String(n).padStart(2,"0");
const formatDateTime=(iso:string)=>{
  const d=new Date(iso);
  return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",hour:"numeric",minute:"2-digit"}).format(d);
};

export default function AlertsPage(){
  const [custom,setCustom]=useState<CustomAlert[]>([]);
  const [events,setEvents]=useState<SystemAlert[]>([]);
  const [overdue,setOverdue]=useState<SystemAlert[]>([]);
  const [query,setQuery]=useState("");
  const [tab,setTab]=useState<"all"|"upcoming"|"history">("all");
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<CustomAlert|null>(null);
  const [form,setForm]=useState<FormState>(emptyForm());
  const [notice,setNotice]=useState("");

  const load=async()=>{
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setNotice("انتهت جلسة الدخول.");return}
    const [u,e,p]=await Promise.all([
      supabase.from("user_data").select("management_modules").eq("user_id",user.user.id).maybeSingle(),
      supabase.from("events").select("id,title,starts_at,ends_at,status,event_type").in("status",["scheduled","pending"]).gte("starts_at",new Date().toISOString()).lte("starts_at",new Date(Date.now()+7*86400000).toISOString()).order("starts_at"),
      supabase.from("payments").select("id,student_name,due_date,total_due,status,currency_code").in("status",["unpaid","partial"]).not("due_date","is",null).lte("due_date",new Date(Date.now()+7*86400000).toISOString().slice(0,10)).order("due_date")
    ]);
    if(u.error)setNotice(u.error.message);
    const raw=u.data?.management_modules?.alerts;
    setCustom(Array.isArray(raw)?raw as CustomAlert[]:[]);
    if(e.error)setNotice(e.error.message);
    const eventRows=(e.data||[]) as any[];
    setEvents(eventRows.map(e=>({id:`event:${e.id}`,title:e.event_type==="personal"?"موعد شخصي: "+e.title:"الحصة القادمة: "+e.title,details:e.event_type==="personal"?"موعد شخصي محفوظ في الجدول.":"موعد دراسي محفوظ في التقويم.",when:e.starts_at,type:"حصة",href:e.event_type==="personal"?"/my-calendar":"/calendar",status:"نشط"})));
    if(p.error)setNotice(p.error.message);
    setOverdue((p.data||[]).map((p:any)=>({id:`payment:${p.id}`,title:"استحقاق دفع: "+p.student_name,details:`المبلغ المستحق ${Number(p.total_due||0).toFixed(2)} ${p.currency_code||""}.`,when:(p.due_date||"")+ "T12:00:00",type:"دفعة",href:"/payments",status:"نشط"})));
  };

  useEffect(()=>{void load()},[]);

  const all=[...custom.map(a=>({id:"custom:"+a.id,title:a.title,details:a.details,when:a.remindAt,type:a.type,href:"",status:a.status,custom:true,raw:a})),...events,...overdue];
  const filtered=useMemo(()=>all.filter(a=>{
    const q=`${a.title} ${a.details} ${a.type}`.toLowerCase();
    const matches=q.includes(query.trim().toLowerCase());
    const d=new Date(a.when).getTime();
    const history=Boolean("custom" in a&&a.status!=="نشط");
    return matches&&(tab==="all"||(tab==="upcoming"&&!history&&d>=Date.now())||(tab==="history"&&history));
  }).sort((a,b)=>new Date(a.when).getTime()-new Date(b.when).getTime()),[all,query,tab]);

  const activeCount=all.filter(a=>a.status==="نشط").length;
  const todayCount=all.filter(a=>{const d=new Date(a.when),n=new Date();return d.toDateString()===n.toDateString()&&a.status==="نشط"}).length;
  const unread=custom.filter(a=>a.status==="نشط").length;
  const snoozed=custom.filter(a=>a.status==="مؤجلة").length;

  const openNew=()=>{setEditing(null);setForm(emptyForm());setOpen(true);setNotice("")};
  const openEdit=(a:CustomAlert)=>{setEditing(a);const d=new Date(a.remindAt);setForm({title:a.title,details:a.details,date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,type:a.type});setOpen(true);setNotice("")};

  const persist=async(next:CustomAlert[])=>{
    const {error}=await supabase.rpc("set_management_module",{p_kind:"alerts",p_rows:next});
    if(error){setNotice(error.message);return false}
    setCustom(next);return true;
  };

  const save=async(e:FormEvent)=>{
    e.preventDefault();
    if(!form.title.trim())return setNotice("اكتب عنوان التنبيه.");
    const remindAt=new Date(`${form.date}T${form.time}:00`);
    if(Number.isNaN(remindAt.getTime()))return setNotice("راجع التاريخ والوقت.");
    const item:CustomAlert={id:editing?.id||crypto.randomUUID(),title:form.title.trim(),details:form.details.trim(),remindAt:remindAt.toISOString(),type:form.type,status:editing?.status||"نشط"};
    const next=editing?custom.map(a=>a.id===editing.id?item:a):[item,...custom];
    if(await persist(next)){setOpen(false);setEditing(null);setNotice(editing?"تم تحديث التنبيه.":"تمت إضافة التنبيه.");}
  };

  const setStatus=async(a:CustomAlert,status:CustomAlert["status"])=>{
    const next=custom.map(x=>x.id===a.id?{...x,status}:x);
    if(await persist(next))setNotice(status==="مقروءة"?"تم تعليم التنبيه كمقروء.":"تم تأجيل التنبيه.");
  };

  const remove=async(a:CustomAlert)=>{
    if(!window.confirm("هل تريد حذف هذا التنبيه؟"))return;
    if(await persist(custom.filter(x=>x.id!==a.id)))setNotice("تم حذف التنبيه.");
  };

  const exportPdf=()=>printRiwaqDocument({
    title:"سجل التنبيهات والتذكيرات",
    subtitle:"التنبيهات المرتبطة بالمواعيد والدفعات والتنبيهات الشخصية.",
    columns:[{key:"title",label:"التنبيه"},{key:"type",label:"النوع"},{key:"when",label:"التاريخ والوقت"},{key:"status",label:"الحالة"}],
    rows:filtered.map(a=>({title:a.title,type:a.type,when:formatDateTime(a.when),status:a.status})),
    summary:[
      {label:"التنبيهات النشطة",value:String(activeCount)},
      {label:"تنبيهات اليوم",value:String(todayCount)},
      {label:"مخصصة غير مقروءة",value:String(unread)},
      {label:"مؤجلة",value:String(snoozed)}
    ]
  });

  return <main className="alerts-page" dir="rtl">
    <header className="alerts-hero">
      <div><span>مركز المتابعة في رواق</span><h1>التنبيهات والتذكيرات</h1><p>صفحة موحدة تربط تنبيهاتك بالمواعيد والمدفوعات والتنبيهات الشخصية.</p></div>
      <div className="alerts-hero-actions no-print"><button className="alerts-secondary" onClick={exportPdf}><FileDown size={16}/> تصدير PDF</button><button className="alerts-primary" onClick={openNew}><Plus size={17}/> إضافة تنبيه</button></div>
    </header>
    {notice&&<div className="alerts-notice"><Check size={16}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={14}/></button></div>}

    <section className="alerts-stats">
      <article><span><Bell size={17}/></span><div><small>التنبيهات النشطة</small><strong>{activeCount}</strong></div></article>
      <article><span><CalendarClock size={17}/></span><div><small>تنبيهات اليوم</small><strong>{todayCount}</strong></div></article>
      <article><span><FileText size={17}/></span><div><small>غير المقروءة</small><strong>{unread}</strong></div></article>
      <article><span><Clock3 size={17}/></span><div><small>مؤجلة</small><strong>{snoozed}</strong></div></article>
    </section>

    <section className="alerts-panel">
      <header className="alerts-toolbar no-print">
        <div className="alerts-tabs"><button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>الكل</button><button className={tab==="upcoming"?"active":""} onClick={()=>setTab("upcoming")}>القادمة</button><button className={tab==="history"?"active":""} onClick={()=>setTab("history")}>السجل</button></div>
        <label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث في التنبيهات..." /></label>
      </header>

      {filtered.length===0?<div className="alerts-empty"><Bell size={28}/><h2>لا توجد تنبيهات مطابقة</h2><p>سيظهر هنا موعدك القادم، تنبيهات الاستحقاقات، والتنبيهات الشخصية.</p><button className="alerts-primary no-print" onClick={openNew}><Plus size={16}/> إضافة تنبيه شخصي</button></div>:
      <div className="alerts-list">{filtered.map(a=>{
        const isCustom="custom" in a;
        return <article key={a.id} className={"alert-card "+(a.status==="مؤجلة"?"snoozed":"")}>
          <span className="alert-icon">{a.type==="حصة"?<CalendarDays size={18}/>:a.type==="دفعة"?<CreditCard size={18}/>:<Bell size={18}/>}</span>
          <div className="alert-main"><div><strong>{a.title}</strong><span className="alert-type">{a.type}</span></div><p>{a.details}</p><small>{formatDateTime(a.when)}</small></div>
          <div className="alert-actions no-print">
            {a.href&&<a href={a.href}><ChevronLeft size={15}/> فتح</a>}
            {isCustom&&<><button onClick={()=>openEdit(a.raw as CustomAlert)} title="تعديل"><FileText size={15}/></button><button onClick={()=>setStatus(a.raw as CustomAlert,"مقروءة")} title="تعليم كمقروء"><Check size={15}/></button><button onClick={()=>setStatus(a.raw as CustomAlert,"مؤجلة")} title="تأجيل"><Snooze size={15}/></button><button onClick={()=>remove(a.raw as CustomAlert)} title="حذف"><Trash2 size={15}/></button></>}
          </div>
        </article>
      })}</div>}
    </section>

    {open&&<div className="alerts-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><form className="alerts-modal" onSubmit={save}>
      <header><div><span><Bell size={18}/></span><div><h2>{editing?"تعديل التنبيه":"إضافة تنبيه شخصي"}</h2><p>سيظهر التنبيه داخل مركز المتابعة.</p></div></div><button type="button" onClick={()=>setOpen(false)}><X size={19}/></button></header>
      <div className="alerts-form">
        <label><span><FileText size={14}/> العنوان</span><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></label>
        <label><span><Bell size={14}/> النوع</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>مهمة عامة</option><option>مراجعة</option><option>اجتماع</option><option>متابعة طالب</option></select></label>
        <div className="alerts-form-grid"><label><span><CalendarDays size={14}/> التاريخ</span><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label><span><Clock3 size={14}/> الوقت</span><input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>
        <label><span><FileText size={14}/> التفاصيل</span><textarea value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="اكتب التفاصيل أو الإجراء المطلوب"/></label>
      </div>
      <footer><button type="button" onClick={()=>setOpen(false)}>إلغاء</button><button className="alerts-save" type="submit"><Check size={16}/> حفظ التنبيه</button></footer>
    </form></div>}
  </main>;
}
