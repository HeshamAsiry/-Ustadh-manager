"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, CreditCard,
  FileText, Printer, TrendingUp, Users, WalletCards, XCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./reports.css";

type Student = { id:string; legacy_id?:string|null; full_name:string; age:number|null; country_name:string|null; monthly_hours:number; status:string; currency_code:string|null; notes:string|null; timezone?:string|null };
type EventRow = { id:string; student_id:string|null; event_type:string; title:string; starts_at:string; ends_at:string; status:string; notes:string|null };
type Payment = { id:string; student_id:string|null; student_name:string|null; billing_period?:string|null; month_year:string|null; amount:number|null; amount_paid:number|null; total_due:number|null; currency_code:string|null; status:string; payment_date:string|null; due_date:string|null };
type Legacy = Record<string,unknown>;

const money=(n:number,c:string|null)=>new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(n)+(c?" "+c:"");
const dateLabel=(v?:string|null)=>v?new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(new Date(v)):"—";
const shortDate=(v?:string|null)=>v?new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"short"}).format(new Date(v)):"—";
const hours=(a:string,b:string)=>Math.max(0,(new Date(b).getTime()-new Date(a).getTime())/3600000);
const arr=(v:unknown):Legacy[]=>Array.isArray(v)?v.filter(x=>x&&typeof x==="object") as Legacy[]:[];
const str=(o:Legacy,...keys:string[])=>{for(const k of keys){const v=o[k];if(typeof v==="string"&&v.trim())return v;if(typeof v==="number")return String(v)}return ""};
const n=(o:Legacy,...keys:string[])=>{for(const k of keys){const v=o[k];if(typeof v==="number")return v;if(typeof v==="string"&&v.trim()&&!Number.isNaN(Number(v)))return Number(v)}return 0};

export default function ReportsPage(){
 const [tab,setTab]=useState<"students"|"finance">("students");
 const [students,setStudents]=useState<Student[]>([]),[events,setEvents]=useState<EventRow[]>([]),[payments,setPayments]=useState<Payment[]>([]);
 const [legacySessions,setLegacySessions]=useState<Legacy[]>([]),[hifz,setHifz]=useState<Legacy[]>([]),[revision,setRevision]=useState<Legacy[]>([]),[juz,setJuz]=useState<Legacy[]>([]);
 const [selectedId,setSelectedId]=useState(""),[search,setSearch]=useState(""),[loading,setLoading]=useState(true),[notice,setNotice]=useState("");
 const [from,setFrom]=useState(()=>{const d=new Date();d.setDate(1);return d.toISOString().slice(0,10)}),[to,setTo]=useState(()=>new Date().toISOString().slice(0,10));

 useEffect(()=>{(async()=>{
   const [s,e,p,u]=await Promise.all([
    supabase.from("students").select("id,legacy_id,full_name,age,country_name,monthly_hours,status,currency_code,notes,timezone").order("full_name"),
    supabase.from("events").select("id,student_id,event_type,title,starts_at,ends_at,status,notes").order("starts_at",{ascending:false}),
    supabase.from("payments").select("id,student_id,student_name,billing_period,month_year,amount,amount_paid,total_due,currency_code,status,payment_date,due_date").order("payment_date",{ascending:false}),
    supabase.auth.getUser()
   ]);
   if(s.error||e.error||p.error){setNotice("تعذر تحميل بيانات التقارير. أعد تحميل الصفحة وحاول مرة أخرى.");setLoading(false);return}
   setStudents((s.data||[]) as Student[]);setEvents((e.data||[]) as EventRow[]);setPayments((p.data||[]) as Payment[]);
   if(u.data.user){
    const legacy=await supabase.from("user_data").select("sessions,exams,student_quran_hifz,student_quran_revision,completed_juz").eq("user_id",u.data.user.id).maybeSingle();
    const d=(legacy.data||{}) as Record<string,unknown>;
    setLegacySessions(arr(d.sessions));setHifz(arr(d.student_quran_hifz));setRevision(arr(d.student_quran_revision));setJuz(arr(d.completed_juz));
   }
   setSelectedId(s.data?.[0]?.id||"");setLoading(false);
 })()},[]);

 const studentsShown=useMemo(()=>students.filter(s=>s.full_name.toLowerCase().includes(search.trim().toLowerCase())),[students,search]);
 const selected=students.find(s=>s.id===selectedId)||null;
 const rangeEvents=useMemo(()=>events.filter(e=>{const d=new Date(e.starts_at);return d>=new Date(from+"T00:00:00")&&d<=new Date(to+"T23:59:59")}),[events,from,to]);
 const studentEvents=useMemo(()=>rangeEvents.filter(e=>e.student_id===selectedId),[rangeEvents,selectedId]);
 const completed=studentEvents.filter(e=>e.status==="completed"),cancelled=studentEvents.filter(e=>e.status==="cancelled");
 const scheduled=studentEvents.filter(e=>e.status==="scheduled"||e.status==="pending");
 const lessonHours=completed.reduce((sum,e)=>sum+hours(e.starts_at,e.ends_at),0);
 const attendance=completed.length+cancelled.length?Math.round(completed.length/(completed.length+cancelled.length)*100):0;
 const selectedPayments=useMemo(()=>payments.filter(p=>p.student_id===selectedId),[payments,selectedId]);
 const due=selectedPayments.reduce((s,p)=>s+Number(p.total_due??p.amount??0),0),paid=selectedPayments.reduce((s,p)=>s+Number(p.amount_paid??0),0),remaining=Math.max(0,due-paid);
 const studentKeys=selected?[selected.id,selected.legacy_id].filter(Boolean) as string[]:[];
 const studentHifz=useMemo(()=>hifz.filter(x=>studentKeys.includes(str(x,"studentId","student_id"))),[hifz,studentKeys.join("|")]);
 const studentRevision=useMemo(()=>revision.filter(x=>studentKeys.includes(str(x,"studentId","student_id"))),[revision,studentKeys.join("|")]);
 const studentJuz=useMemo(()=>juz.filter(x=>studentKeys.includes(str(x,"studentId","student_id"))),[juz,studentKeys.join("|")]);
 const studentLegacySessions=useMemo(()=>legacySessions.filter(x=>studentKeys.includes(str(x,"studentId","student_id"))&&(!str(x,"date")||str(x,"date")>=from&&str(x,"date")<=to)),[legacySessions,selectedId,from,to]);
 const finance=useMemo(()=>{
   const map=new Map<string,{due:number;paid:number}>();
   payments.forEach(p=>{const c=p.currency_code||"غير محدد";const v=map.get(c)||{due:0,paid:0};v.due+=Number(p.total_due??p.amount??0);v.paid+=Number(p.amount_paid??0);map.set(c,v)});
   const rows=[...map.entries()].map(([currency,v])=>({currency,...v,remaining:Math.max(0,v.due-v.paid)}));
   return {rows,due:rows.reduce((s,r)=>s+r.due,0),paid:rows.reduce((s,r)=>s+r.paid,0),remaining:rows.reduce((s,r)=>s+r.remaining,0),pending:payments.filter(p=>!["paid","completed"].includes((p.status||"").toLowerCase())).length}
 },[payments]);

 if(loading)return <main className="reports-page reports-loading" dir="rtl"><div><div className="report-mark">ر</div><p>جارٍ جمع بيانات التقارير من رِواق…</p></div></main>;

 return <main className="reports-page" dir="rtl">
  <header className="reports-hero"><div><span className="reports-kicker"><BarChart3 size={15}/> مركز التقارير</span><h1>التقارير والتحليلات</h1><p>تقارير مترابطة مباشرة مع الطلاب والحصص والساعات والقرآن والحسابات المالية.</p></div><button className="report-print" onClick={()=>window.print()}><Printer size={17}/> طباعة / PDF</button></header>
  {notice&&<div className="reports-notice">{notice}<button onClick={()=>setNotice("")}><XCircle size={15}/></button></div>}
  <nav className="report-tabs"><button className={tab==="students"?"active":""} onClick={()=>setTab("students")}><Users size={17}/> تقارير الطلاب</button><button className={tab==="finance"?"active":""} onClick={()=>setTab("finance")}><WalletCards size={17}/> التقارير المالية</button></nav>

  {tab==="students"&&<section className="report-body">
   <div className="report-controls">
    <label className="wide">الطالب<div className="select-wrap"><Users size={16}/><select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{studentsShown.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select></div></label>
    <label className="search-field">بحث<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم الطالب"/></label>
    <label>من<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>إلى<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
   </div>
   {!selected?<div className="report-empty"><Users size={26}/><h2>لا يوجد طالب</h2><p>أضف طالبًا من قسم الطلاب ثم أنشئ تقريره هنا.</p></div>:<>
    <section className="student-cover"><div className="student-identity"><div className="student-avatar">{selected.full_name.slice(0,1)}</div><div><span>تقرير الطالب</span><h2>{selected.full_name}</h2><p>{selected.country_name||"الدولة غير محددة"} · {selected.age==null?"العمر غير محدد":selected.age+" سنة"} · {selected.status==="active"?"نشط":"غير نشط"}</p></div></div><div><span>الفترة</span><strong>{dateLabel(from)} — {dateLabel(to)}</strong></div></section>

    <section className="metric-grid"><article className="featured"><span><Clock3 size={15}/> الساعات المكتملة</span><strong>{lessonHours.toFixed(1)}</strong><small>ساعة تدريس</small></article><article><span><CalendarDays size={15}/> الحصص</span><strong>{completed.length}</strong><small>{scheduled.length} مجدولة · {cancelled.length} ملغاة</small></article><article><span><TrendingUp size={15}/> الحضور</span><strong>{attendance}%</strong><small>من الحصص المكتملة والملغاة</small></article><article><span><CreditCard size={15}/> المتبقي</span><strong>{money(remaining,selected.currency_code)}</strong><small>على حساب الطالب</small></article></section>

    <section className="report-grid"><article className="report-card"><header><div><span>الصورة التعليمية</span><h3>ملخص الطالب</h3></div><TrendingUp size={18}/></header><div className="detail-list"><div><span>الساعات الشهرية المتفق عليها</span><strong>{selected.monthly_hours} ساعة</strong></div><div><span>الساعات المحسوبة في الفترة</span><strong>{lessonHours.toFixed(1)} ساعة</strong></div><div><span>الساعات المتبقية</span><strong>{Math.max(0,Number(selected.monthly_hours)-lessonHours).toFixed(1)} ساعة</strong></div><div><span>آخر حصة مكتملة</span><strong>{completed[0]?shortDate(completed[0].starts_at):"لا توجد"}</strong></div></div></article>
    <article className="report-card"><header><div><span>الحساب</span><h3>ملخص مالي للطالب</h3></div><WalletCards size={18}/></header><div className="detail-list"><div><span>إجمالي المستحق</span><strong>{money(due,selected.currency_code)}</strong></div><div><span>إجمالي المدفوع</span><strong>{money(paid,selected.currency_code)}</strong></div><div><span>المتبقي</span><strong className={remaining?"warning":"success"}>{money(remaining,selected.currency_code)}</strong></div><div><span>حالة الحساب</span><strong>{remaining?"يحتاج متابعة":"مسدد"}</strong></div></div></article></section>

    <section className="report-card full"><header><div><span>السجل التعليمي</span><h3>الحصص في الفترة</h3></div><b>{studentEvents.length} سجل</b></header><div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>الحصة</th><th>المدة</th><th>الحالة</th><th>ملاحظات</th></tr></thead><tbody>{studentEvents.length?studentEvents.map(e=><tr key={e.id}><td>{dateLabel(e.starts_at)}</td><td><strong>{e.title}</strong></td><td>{hours(e.starts_at,e.ends_at).toFixed(1)} ساعة</td><td><span className={"status "+e.status}>{e.status==="completed"?"مكتملة":e.status==="cancelled"?"ملغاة":e.status==="pending"?"معلقة":"مجدولة"}</span></td><td>{e.notes||"—"}</td></tr>):<tr><td colSpan={5} className="empty-cell">لا توجد حصص في الفترة المحددة.</td></tr>}</tbody></table></div></section>

    <section className="report-grid"><article className="report-card"><header><div><span>القرآن الكريم</span><h3>الحفظ والمراجعة</h3></div><BookOpen size={18}/></header><div className="quran-stats"><div><strong>{studentHifz.length}</strong><span>سجلات حفظ</span></div><div><strong>{studentRevision.length}</strong><span>سجلات مراجعة</span></div><div><strong>{studentJuz.length}</strong><span>أجزاء مكتملة</span></div></div><div className="mini-list">{studentHifz.slice(-6).reverse().map((x,i)=><div key={i}><strong>{str(x,"surahName","surah_name")||"حفظ قرآن"}</strong><span>{str(x,"hifzDate","date")||"—"}</span></div>)}{!studentHifz.length&&<p>لا توجد سجلات حفظ مرتبطة بالطالب.</p>}</div></article>
    <article className="report-card"><header><div><span>المتابعة</span><h3>ملاحظات الحصص والتقدم</h3></div><FileText size={18}/></header><div className="notes-list">{selected.notes&&<div><b>ملف الطالب</b><p>{selected.notes}</p></div>}{studentEvents.filter(e=>e.notes).slice(0,6).map(e=><div key={e.id}><b>{shortDate(e.starts_at)}</b><p>{e.notes}</p></div>)}{studentLegacySessions.slice(0,6).map((x,i)=><div key={"l"+i}><b>{str(x,"date")||"جلسة سابقة"}</b><p>{str(x,"whatWasReviewed","progressNotes","notes")||"لا توجد ملاحظة إضافية."}</p></div>)}{!selected.notes&&!studentEvents.some(e=>e.notes)&&!studentLegacySessions.length&&<p>لا توجد ملاحظات إضافية مسجلة.</p>}</div></article></section>

    <section className="report-card full"><header><div><span>الحسابات</span><h3>السجل المالي للطالب</h3></div><b>{selectedPayments.length} حركة</b></header><div className="table-wrap"><table><thead><tr><th>الفترة</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>{selectedPayments.length?selectedPayments.map(p=>{const d=Number(p.total_due??p.amount??0),a=Number(p.amount_paid??0);return <tr key={p.id}><td><strong>{p.month_year||p.billing_period||"—"}</strong></td><td>{money(d,p.currency_code||selected.currency_code)}</td><td>{money(a,p.currency_code||selected.currency_code)}</td><td>{money(Math.max(0,d-a),p.currency_code||selected.currency_code)}</td><td>{dateLabel(p.payment_date||p.due_date)}</td><td><span className={"status "+p.status}>{p.status||"غير محددة"}</span></td></tr>;}):<tr><td colSpan={6} className="empty-cell">لا توجد معاملات مالية للطالب.</td></tr>}</tbody></table></div></section>
   </>}
  </section>}

  {tab==="finance"&&<section className="report-body">
   <section className="metric-grid"><article className="featured"><span><WalletCards size={15}/> إجمالي المستحق</span><strong>{money(finance.due,null)}</strong><small>كل الحسابات</small></article><article><span><CheckCircle2 size={15}/> إجمالي المدفوع</span><strong>{money(finance.paid,null)}</strong><small>حتى آخر حركة</small></article><article><span><CreditCard size={15}/> المتبقي</span><strong>{money(finance.remaining,null)}</strong><small>قابل للمتابعة</small></article><article><span><FileText size={15}/> حركات تحتاج متابعة</span><strong>{finance.pending}</strong><small>بحسب الحالة المسجلة</small></article></section>
   <section className="report-grid"><article className="report-card"><header><div><span>العملات</span><h3>توزيع الحسابات</h3></div><WalletCards size={18}/></header><div className="finance-list">{finance.rows.map(r=><div key={r.currency}><div className="finance-head"><strong>{r.currency}</strong><span>{money(r.paid,r.currency==="غير محدد"?null:r.currency)} من {money(r.due,r.currency==="غير محدد"?null:r.currency)}</span></div><div className="finance-bar"><i style={{width:(r.due?Math.min(100,r.paid/r.due*100):0)+"%"}}/></div><small>متبقي {money(r.remaining,r.currency==="غير محدد"?null:r.currency)}</small></div>)}{!finance.rows.length&&<p>لا توجد بيانات مالية.</p>}</div></article>
   <article className="report-card"><header><div><span>التحصيل</span><h3>مؤشرات مالية</h3></div><TrendingUp size={18}/></header><div className="detail-list"><div><span>نسبة التحصيل</span><strong>{finance.due?Math.round(finance.paid/finance.due*100):0}%</strong></div><div><span>عدد الحركات</span><strong>{payments.length}</strong></div><div><span>طلاب لديهم معاملات</span><strong>{new Set(payments.map(p=>p.student_id).filter(Boolean)).size}</strong></div><div><span>آخر حركة</span><strong>{payments[0]?dateLabel(payments[0].payment_date||payments[0].due_date):"لا توجد"}</strong></div></div></article></section>
   <section className="report-card full"><header><div><span>السجل المالي</span><h3>كل الحركات المالية</h3></div><b>{payments.length} حركة</b></header><div className="table-wrap"><table><thead><tr><th>الطالب</th><th>الفترة</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>{payments.length?payments.map(p=>{const d=Number(p.total_due??p.amount??0),a=Number(p.amount_paid??0);return <tr key={p.id}><td><strong>{p.student_name||students.find(s=>s.id===p.student_id)?.full_name||"غير محدد"}</strong></td><td>{p.month_year||p.billing_period||"—"}</td><td>{money(d,p.currency_code)}</td><td>{money(a,p.currency_code)}</td><td>{money(Math.max(0,d-a),p.currency_code)}</td><td>{dateLabel(p.payment_date||p.due_date)}</td><td><span className={"status "+p.status}>{p.status||"غير محددة"}</span></td></tr>}):<tr><td colSpan={7} className="empty-cell">لا توجد حركات مالية.</td></tr>}</tbody></table></div></section>
  </section>}
  <footer className="reports-footer">رِواق · التقارير تُبنى من البيانات المسجلة داخل المنصة، مع إمكانية الطباعة أو الحفظ PDF من المتصفح.</footer>
 </main>;
}
