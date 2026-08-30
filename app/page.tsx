"use client";
import {useState} from "react";
import {CalendarDays, Users, BookOpen, Clock3, Bell, BarChart3, Settings, BookMarked, ClipboardCheck, Wallet, UserRound, Plus, CheckCircle2, Menu} from "lucide-react";

const nav=[['الرئيسية',BarChart3],['التقويم',CalendarDays],['الطلاب',Users],['المسارات التعليمية',BookOpen],['القرآن',BookMarked],['الاختبارات',ClipboardCheck],['جدولي الشخصي',Clock3],['الساعات',Clock3],['المدفوعات',Wallet],['التقارير',BarChart3],['التنبيهات',Bell],['الإعدادات',Settings]] as const;
const lessons=[
 {time:'14:00',name:'أحمد',meta:'قرآن + قراءة · 60 دقيقة',tag:'قادم'},
 {time:'16:00',name:'فاضل',meta:'عربية + قرآن · 60 دقيقة',tag:'قادم'},
 {time:'18:00',name:'حفظ شخصي',meta:'سورة النبأ · 45 دقيقة',tag:'شخصي'},
 {time:'20:00',name:'درس خاص بك',meta:'طلب علم · 60 دقيقة',tag:'شخصي'}
];
export default function Home(){
 const [active,setActive]=useState('الرئيسية');
 return <div className="app">
  <aside className="sidebar"><div className="brand">Ustadh Manager<small>إدارة التدريس والطلاب</small></div><nav className="nav">{nav.map(([label,Icon])=><button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={17} style={{verticalAlign:'middle',marginLeft:9}}/>{label}</button>)}</nav></aside>
  <main className="main"><div className="top"><div><div className="eyebrow">الأحد، 30 أغسطس 2026</div><div className="title">صباح الخير 👋</div><div className="eyebrow">إليك نظرة سريعة على يومك وعملك.</div></div><div className="actions"><button className="btn"><Bell size={17}/></button><button className="btn primary"><Plus size={17}/> إضافة</button></div></div>
   <section className="grid stats"><Stat icon={<Clock3 size={19}/>} label="ساعات التدريس هذا الشهر" value="42 ساعة"/><Stat icon={<Users size={19}/>} label="الطلاب النشطون" value="12"/><Stat icon={<CalendarDays size={19}/>} label="الساعات المتاحة" value="6 ساعات"/><Stat icon={<ClipboardCheck size={19}/>} label="الاختبارات القادمة" value="3"/></section>
   <section className="grid layout"><div className="card"><div className="section-title">جدول اليوم</div>{lessons.map((x,i)=><div className="event" key={i}><div className="time">{x.time}</div><div className="dot"/><div className="event-main"><div className="event-name">{x.name}</div><div className="event-meta">{x.meta}</div></div><span className="pill">{x.tag}</span></div>)}</div>
   <div className="card"><div className="section-title">تنبيهات ومهام</div><div className="notice">🔔 <b>بعد 30 دقيقة</b><br/>حصة أحمد — قرآن + قراءة</div><div className="notice">📝 <b>اختبار قادم</b><br/>فاضل — اختبار جزء عم غدًا</div><div className="notice">🟡 <b>تعويض معلّق</b><br/>محمد لديه حصة مؤجلة بانتظار الاتفاق</div><div className="notice"><CheckCircle2 size={15} style={{verticalAlign:'middle'}}/> <b>وقت متاح</b><br/>الأحد 19:00–20:00 لاستقبال طالب جديد</div></div></section>
   <section className="grid layout"><div className="card"><div className="section-title">متابعة الطلاب</div><Student name="أحمد" detail="نور البيان · الدرس 32" value={80}/><Student name="فاضل" detail="العربية بين يدي أولادنا · الوحدة 4" value={60}/><Student name="محمد" detail="جزء عم · 15 من 37 سورة" value={41}/></div><div className="card"><div className="section-title">ساعات الشهر</div><div className="stat-value">42:00</div><div className="eyebrow">إجمالي التدريس</div><div className="notice" style={{marginTop:14}}>المتفق هذا الشهر: <b>46 ساعة</b></div><div className="progress"><span style={{width:'91%'}}/></div></div></section>
  </main><div className="mobile-nav">{nav.slice(0,5).map(([label,Icon])=><button key={label} onClick={()=>setActive(label)}><Icon size={18}/><br/>{label}</button>)}</div>
 </div>
}
function Stat({icon,label,value}:{icon:React.ReactNode,label:string,value:string}){return <div className="card"><div style={{color:'var(--accent)'}}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>}
function Student({name,detail,value}:{name:string,detail:string,value:number}){return <div style={{marginBottom:18}}><div style={{display:'flex',justifyContent:'space-between'}}><b>{name}</b><span className="eyebrow">{value}%</span></div><div className="event-meta">{detail}</div><div className="progress"><span style={{width:`${value}%`}}/></div></div>}
