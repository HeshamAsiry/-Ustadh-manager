"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CreditCard, FileDown, FileText, Pencil, Plus, Search, UserRound, WalletCards, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { printRiwaqDocument } from "../../lib/print-document";
import "./payments.css";

type Student = { id:string; full_name:string };
type Payment = {
  id:string; student_id:string|null; student_name:string; month_year:string|null;
  amount:number; amount_paid:number; total_due:number; currency_code:string;
  status:"paid"|"partial"|"unpaid"; payment_method:string|null; payment_date:string|null;
  due_date:string|null; notes:string|null;
};

type FormState = {
  studentId:string; studentName:string; month:string; amount:string; paid:string;
  currency:string; paymentMethod:string; paymentDate:string; dueDate:string; notes:string;
};

const emptyForm=(month:string):FormState=>({
  studentId:"",studentName:"",month,amount:"",paid:"",currency:"EUR",
  paymentMethod:"تحويل بنكي",paymentDate:"",dueDate:"",notes:""
});

const money=(value:number,currency:string)=>`${value.toFixed(2)} ${currency}`;

export default function PaymentsPage(){
  const [payments,setPayments]=useState<Payment[]>([]);
  const [students,setStudents]=useState<Student[]>([]);
  const [query,setQuery]=useState("");
  const [month,setMonth]=useState("");
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Payment|null>(null);
  const [form,setForm]=useState<FormState>(emptyForm(new Date().toISOString().slice(0,7)));
  const [notice,setNotice]=useState("");

  const load=async()=>{
    setLoading(true);
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setNotice("انتهت جلسة الدخول.");setLoading(false);return}
    const [p,s]=await Promise.all([
      supabase.from("payments").select("id,student_id,student_name,month_year,amount,amount_paid,total_due,currency_code,status,payment_method,payment_date,due_date,notes").order("month_year",{ascending:false}).order("student_name"),
      supabase.from("students").select("id,full_name").neq("status","archived").order("full_name")
    ]);
    if(p.error)setNotice(p.error.message); else setPayments((p.data||[]) as Payment[]);
    if(s.error)setNotice(s.error.message); else setStudents((s.data||[]) as Student[]);
    setLoading(false);
  };

  useEffect(()=>{void load()},[]);

  const filtered=useMemo(()=>payments.filter(p=>{
    const text=`${p.student_name} ${p.currency_code} ${p.payment_method||""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase())&&(!month||p.month_year===month);
  }),[payments,query,month]);

  const currencies=[...new Set(payments.map(p=>p.currency_code).filter(Boolean))];
  const totalPaid=filtered.reduce((n,p)=>n+Number(p.amount_paid||0),0);
  const totalDue=filtered.reduce((n,p)=>n+Math.max(0,Number(p.total_due||0)),0);
  const outstanding=filtered.filter(p=>p.status!=="paid").length;

  const openNew=()=>{
    setEditing(null);
    setForm(emptyForm(new Date().toISOString().slice(0,7)));
    setOpen(true);setNotice("");
  };

  const openEdit=(p:Payment)=>{
    setEditing(p);
    setForm({
      studentId:p.student_id||"",studentName:p.student_name,month:p.month_year||new Date().toISOString().slice(0,7),
      amount:String(p.amount||""),paid:String(p.amount_paid||""),currency:p.currency_code||"EUR",
      paymentMethod:p.payment_method||"تحويل بنكي",paymentDate:p.payment_date||"",dueDate:p.due_date||"",notes:p.notes||""
    });
    setOpen(true);setNotice("");
  };

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    const amount=Number(form.amount), paid=Number(form.paid||0);
    if(!form.studentName.trim())return setNotice("اكتب اسم الطالب أو اختر طالبًا.");
    if(!Number.isFinite(amount)||amount<0)return setNotice("أدخل إجمالي مبلغ صحيح.");
    if(!Number.isFinite(paid)||paid<0||paid>amount)return setNotice("المبلغ المدفوع يجب ألا يتجاوز إجمالي المبلغ.");
    if(!/^\d{4}-\d{2}$/.test(form.month))return setNotice("اختر الفترة الشهرية.");
    const {data:user}=await supabase.auth.getUser();
    if(!user.user)return setNotice("انتهت جلسة الدخول.");
    const status=paid===0?"unpaid":paid>=amount?"paid":"partial";
    const payload={
      teacher_id:user.user.id,student_id:form.studentId||null,student_name:form.studentName.trim(),
      month_year:form.month,billing_period:form.month,hourly_rate:0,agreed_hours:0,actual_hours:0,total_hours_billed:0,
      amount:Number(amount.toFixed(2)),amount_paid:Number(paid.toFixed(2)),total_due:Number(Math.max(0,amount-paid).toFixed(2)),
      currency_code:form.currency.trim().toUpperCase().slice(0,5)||"EUR",status,payment_method:form.paymentMethod||null,
      payment_date:form.paymentDate||null,due_date:form.dueDate||null,notes:form.notes.trim()||null
    };
    const result=editing
      ? await supabase.from("payments").update(payload).eq("id",editing.id).select("id").single()
      : await supabase.from("payments").insert(payload).select("id").single();
    if(result.error)return setNotice(result.error.message);
    setOpen(false);setEditing(null);setNotice(editing?"تم تحديث معاملة الدفع.":"تم تسجيل معاملة الدفع.");
    await load();
  };

  const remove=async(p:Payment)=>{
    if(!window.confirm(`هل تريد حذف معاملة ${p.student_name}؟`))return;
    const {error}=await supabase.from("payments").delete().eq("id",p.id);
    if(error)setNotice(error.message);else{setNotice("تم حذف المعاملة.");setPayments(v=>v.filter(x=>x.id!==p.id))}
  };

  const exportPdf=()=>{
    const summary=[
      {label:"إجمالي المدفوع",value:currencies.length===1?money(totalPaid,currencies[0]):"متعدد العملات"},
      {label:"إجمالي المستحق",value:currencies.length===1?money(totalDue,currencies[0]):"متعدد العملات"},
      {label:"المعاملات",value:String(filtered.length)},
      {label:"حسابات مفتوحة",value:String(outstanding)}
    ];
    printRiwaqDocument({
      title:"سجل معاملات الدفع",
      subtitle:"كشف منظم للدفعات والحسابات المسجلة في رواق.",
      period:month||"جميع الفترات",
      columns:[
        {key:"student",label:"الطالب"},
        {key:"period",label:"الفترة"},
        {key:"amount",label:"الإجمالي"},
        {key:"paid",label:"المدفوع"},
        {key:"due",label:"المستحق"},
        {key:"status",label:"الحالة"},
        {key:"date",label:"تاريخ الدفع"}
      ],
      rows:filtered.map(p=>({
        student:p.student_name,period:p.month_year||"—",amount:money(p.amount,p.currency_code),
        paid:money(p.amount_paid,p.currency_code),due:money(p.total_due,p.currency_code),
        status:p.status==="paid"?"مدفوعة":p.status==="partial"?"مدفوعة جزئيًا":"غير مدفوعة",
        date:p.payment_date||"—"
      })),
      summary
    });
  };

  return <main className="payments-page" dir="rtl">
    <header className="payments-hero">
      <div><span className="payments-kicker">إدارة رواق</span><h1>المدفوعات والمعاملات</h1><p>تسجيل الدفعات ومتابعة المستحقات لكل طالب مع حفظ البيانات في قاعدة رواق.</p></div>
      <div className="payments-hero-actions no-print">
        <button className="payments-secondary" onClick={exportPdf}><FileDown size={16}/> تصدير PDF</button>
        <button className="payments-primary" onClick={openNew}><Plus size={17}/> تسجيل معاملة</button>
      </div>
    </header>

    {notice&&<div className="payments-notice" role="status"><Check size={16}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={14}/></button></div>}

    <section className="payments-summary">
      <article><span className="payments-summary-icon"><WalletCards size={18}/></span><div><small>إجمالي المدفوع</small><strong>{currencies.length===1?money(totalPaid,currencies[0]):"متعدد العملات"}</strong></div></article>
      <article><span className="payments-summary-icon"><CreditCard size={18}/></span><div><small>إجمالي المستحق</small><strong>{currencies.length===1?money(totalDue,currencies[0]):"متعدد العملات"}</strong></div></article>
      <article><span className="payments-summary-icon"><FileText size={18}/></span><div><small>عدد المعاملات</small><strong>{filtered.length}</strong></div></article>
      <article><span className="payments-summary-icon"><CalendarDays size={18}/></span><div><small>حسابات مفتوحة</small><strong>{outstanding}</strong></div></article>
    </section>

    <section className="payments-panel">
      <header className="payments-toolbar no-print">
        <label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث باسم الطالب أو طريقة الدفع..." /></label>
        <input className="month-filter" type="month" value={month} onChange={e=>setMonth(e.target.value)} aria-label="تصفية حسب الشهر"/>
        <button onClick={()=>{setQuery("");setMonth("")}}>إعادة التصفية</button>
      </header>

      {loading?<div className="payments-empty">جارٍ تحميل معاملات الدفع...</div>:filtered.length===0?<div className="payments-empty"><CreditCard size={28}/><h2>لا توجد معاملات</h2><p>ابدأ بتسجيل أول معاملة دفع لتظهر في السجل.</p><button className="payments-primary no-print" onClick={openNew}><Plus size={16}/> تسجيل معاملة</button></div>:
      <div className="payments-table-wrap"><table><thead><tr><th>الطالب</th><th>الفترة</th><th>الإجمالي</th><th>المدفوع</th><th>المستحق</th><th>الحالة</th><th>تاريخ الدفع</th><th className="no-print"></th></tr></thead>
      <tbody>{filtered.map(p=><tr key={p.id}>
        <td><div className="payment-student"><span><UserRound size={15}/></span><div><strong>{p.student_name}</strong><small>{p.payment_method||"بدون تحديد"}</small></div></div></td>
        <td>{p.month_year||"—"}</td><td>{money(p.amount,p.currency_code)}</td><td>{money(p.amount_paid,p.currency_code)}</td><td>{money(p.total_due,p.currency_code)}</td>
        <td><span className={"payment-status "+p.status}>{p.status==="paid"?"مدفوعة":p.status==="partial"?"مدفوعة جزئيًا":"غير مدفوعة"}</span></td>
        <td>{p.payment_date||"—"}</td><td className="no-print"><div className="payment-actions"><button onClick={()=>openEdit(p)} aria-label="تعديل"><Pencil size={15}/></button><button onClick={()=>remove(p)} aria-label="حذف"><X size={15}/></button></div></td>
      </tr>)}</tbody></table></div>}
    </section>

    {open&&<div className="payments-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><form className="payments-modal" onSubmit={submit}>
      <header><div><span className="payments-modal-icon"><CreditCard size={18}/></span><div><h2>{editing?"تعديل معاملة الدفع":"تسجيل معاملة دفع"}</h2><p>تُحسب حالة المعاملة تلقائيًا من المبلغ المدفوع.</p></div></div><button type="button" onClick={()=>setOpen(false)}><X size={19}/></button></header>
      <div className="payments-form">
        <label><span><UserRound size={14}/> الطالب</span><select value={form.studentId} onChange={e=>{const s=students.find(x=>x.id===e.target.value);setForm(v=>({...v,studentId:e.target.value,studentName:s?.full_name||v.studentName}))}}><option value="">بدون ربط بطالب</option>{students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
        <label><span><FileText size={14}/> اسم الطالب في السجل</span><input value={form.studentName} onChange={e=>setForm({...form,studentName:e.target.value})} required/></label>
        <div className="payment-form-grid">
          <label><span><CalendarDays size={14}/> الفترة الشهرية</span><input type="month" value={form.month} onChange={e=>setForm({...form,month:e.target.value})}/></label>
          <label><span><CreditCard size={14}/> العملة</span><input value={form.currency} onChange={e=>setForm({...form,currency:e.target.value.toUpperCase().slice(0,5)})}/></label>
        </div>
        <div className="payment-form-grid">
          <label><span><WalletCards size={14}/> إجمالي المبلغ</span><input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
          <label><span><WalletCards size={14}/> المبلغ المدفوع</span><input type="number" min="0" step="0.01" value={form.paid} onChange={e=>setForm({...form,paid:e.target.value})}/></label>
        </div>
        <div className="payment-form-grid">
          <label><span><CreditCard size={14}/> طريقة الدفع</span><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option>تحويل بنكي</option><option>نقدًا</option><option>محفظة إلكترونية</option><option>بطاقة</option><option>أخرى</option></select></label>
          <label><span><CalendarDays size={14}/> تاريخ الدفع</span><input type="date" value={form.paymentDate} onChange={e=>setForm({...form,paymentDate:e.target.value})}/></label>
        </div>
        <label><span><CalendarDays size={14}/> تاريخ الاستحقاق</span><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label>
        <label><span><FileText size={14}/> ملاحظات</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="ملاحظات مرتبطة بالمعاملة"/></label>
      </div>
      <footer><button type="button" onClick={()=>setOpen(false)}>إلغاء</button><button className="payments-save" type="submit"><Check size={16}/> حفظ المعاملة</button></footer>
    </form></div>}
  </main>;
}
