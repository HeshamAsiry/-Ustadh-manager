"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Plus, Trash2, BookOpen, GraduationCap, Brain, NotebookPen, User } from "lucide-react";
import { createTeacherBlock, deleteTeacherBlock, getTeacherBlocks } from "../app/lib/data";

type Block = { id:string; title:string; starts_at:string; ends_at:string; block_type:string; notes?:string|null };
const TYPES = [
  ["memorization","حفظ قرآن","green"],
  ["revision","مراجعة قرآن","blue"],
  ["study","درس علم","brown"],
  ["prep","تحضير / مطالعة","purple"],
  ["teaching","تدريس","orange"],
  ["personal","شخصي","gray"],
  ["other","أخرى","gray"],
] as const;
const labels:Record<string,string> = Object.fromEntries(TYPES.map(x=>[x[0],x[1]]));
const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

function fmtDate(d:Date){ return d.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"}); }
function duration(a:string,b:string){ return Math.max(0,(new Date(b).getTime()-new Date(a).getTime())/60000); }
function durText(m:number){ const h=Math.floor(m/60), min=Math.round(m%60); return h ? `${h}س${min?` ${min}د`:""}` : `${min}د`; }
function typeIcon(t:string){ if(t==="memorization")return <BookOpen size={17}/>; if(t==="revision")return <Check size={17}/>; if(t==="study")return <GraduationCap size={17}/>; if(t==="prep")return <NotebookPen size={17}/>; if(t==="teaching")return <Brain size={17}/>; return <User size={17}/>; }

export default function PersonalScheduleV2(){
 const [blocks,setBlocks]=useState<Block[]>([]),[selected,setSelected]=useState(new Date()),[show,setShow]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [form,setForm]=useState({title:"",start:"",end:"",type:"memorization",notes:""});
 const load=async()=>{setLoading(true);const r=await getTeacherBlocks();if(r.error)setError(r.error.message);else setBlocks((r.data||[]) as Block[]);setLoading(false)};
 useEffect(()=>{load()},[]);
 const dayBlocks=useMemo(()=>blocks.filter(b=>{const d=new Date(b.starts_at);return d.getFullYear()===selected.getFullYear()&&d.getMonth()===selected.getMonth()&&d.getDate()===selected.getDate()}).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime()),[blocks,selected]);
 const stats=useMemo(()=>{const out:Record<string,number>={};dayBlocks.forEach(b=>out[b.block_type]=(out[b.block_type]||0)+duration(b.starts_at,b.ends_at));return out},[dayBlocks]);
 const total=dayBlocks.reduce((n,b)=>n+duration(b.starts_at,b.ends_at),0);
 async function add(e:React.FormEvent){e.preventDefault();setError("");if(!form.title||!form.start||!form.end)return;const date=selected.toISOString().slice(0,10);const s=new Date(`${date}T${form.start}:00`),en=new Date(`${date}T${form.end}:00`);if(en<=s){setError("وقت النهاية يجب أن يكون بعد البداية");return}const r=await createTeacherBlock({title:form.title,starts_at:s.toISOString(),ends_at:en.toISOString(),block_type:form.type,notes:form.notes||null});if(r.error)setError(r.error.message);else{setForm({title:"",start:"",end:"",type:"memorization",notes:""});setShow(false);load()}}
 async function remove(id:string){const r=await deleteTeacherBlock(id);if(r.error)setError(r.error.message);else load()}
 function move(n:number){const d=new Date(selected);d.setDate(d.getDate()+n);setSelected(d)}
 return <section className="personal-v2" dir="rtl">
  <div className="hero"><div><p className="eyebrow">الإدارة</p><h2>جدولي الشخصي</h2><p>إدارة يومك العلمي والتعليمي في جدول زمني واضح، مع احتساب وقت القرآن والعلم والتدريس.</p></div><button className="primary-btn" onClick={()=>setShow(true)}><Plus size={17}/> إضافة نشاط</button></div>
  <div className="day-bar"><button className="outline-btn" onClick={()=>move(-1)}>اليوم السابق</button><div><b>{fmtDate(selected)}</b><span>{selected.toLocaleDateString("ar-EG")}</span></div><button className="outline-btn" onClick={()=>move(1)}>اليوم التالي</button></div>
  <div className="stats-row"><div className="stat-card"><span>إجمالي اليوم</span><b>{durText(total)}</b></div><div className="stat-card"><span>القرآن</span><b>{durText((stats.memorization||0)+(stats.revision||0))}</b></div><div className="stat-card"><span>العلم</span><b>{durText((stats.study||0)+(stats.prep||0))}</b></div><div className="stat-card"><span>التدريس</span><b>{durText(stats.teaching||0)}</b></div></div>
  <div className="goals-card"><div><h3>هدف اليوم</h3><p>اجعل يومك واضحًا: حفظ، مراجعة، طلب علم، ثم التدريس والتحضير.</p></div><button className="outline-btn" onClick={()=>setShow(true)}><Plus size={15}/> أضف هدفًا كنشاط</button></div>
  {error&&<p className="login-error">{error}</p>}
  <div className="timeline-card"><div className="timeline-head"><h3>الجدول الزمني</h3><span>{dayBlocks.length} نشاط</span></div>{loading?<p className="muted">جاري التحميل…</p>:dayBlocks.length===0?<div className="empty-state"><Clock3 size={28}/><b>لا توجد أنشطة لهذا اليوم</b><span>أضف أول نشاط وحدد مدته، وسيظهر هنا ككتلة زمنية.</span><button className="primary-btn" onClick={()=>setShow(true)}><Plus size={16}/> إضافة نشاط</button></div>:<div className="timeline">{dayBlocks.map(b=>{const t=TYPES.find(x=>x[0]===b.block_type)||TYPES[6];return <div className={`timeline-item type-${t[2]}`} key={b.id}><div className="timeline-time"><b>{new Date(b.starts_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</b><span>{new Date(b.ends_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span></div><div className="timeline-dot">{typeIcon(b.block_type)}</div><div className="timeline-block"><div className="timeline-title"><div><b>{b.title}</b><span>{labels[b.block_type]||"أخرى"} · {durText(duration(b.starts_at,b.ends_at))}</span></div><button className="mini-btn" onClick={()=>remove(b.id)} aria-label="حذف"><Trash2 size={14}/></button></div>{b.notes&&<p>{b.notes}</p>}</div></div>})}</div>}</div>
  {show&&<div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setShow(false)}><form className="card form activity-modal" onSubmit={add}><div className="modal-head"><div><p className="eyebrow">{selected.toLocaleDateString("ar-EG")}</p><h3>إضافة نشاط</h3></div><button type="button" className="mini-btn" onClick={()=>setShow(false)}>×</button></div><label>اسم النشاط<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="مثال: حفظ سورة العاديات" required/></label><div className="form-grid"><label>النوع<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option value={t[0]} key={t[0]}>{t[1]}</option>)}</select></label><label>من<input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})} required/></label><label>إلى<input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})} required/></label></div><label>ملاحظات<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="السورة، الصفحات، الباب، أو أي ملاحظة…"/></label><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setShow(false)}>إلغاء</button><button className="primary-btn"><Plus size={16}/> حفظ النشاط</button></div></form></div>}
 </section>
}
