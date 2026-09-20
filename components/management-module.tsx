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
  paths:{title:"المسارات التعليمية",subtitle:"نظّم المناهج ومراحلها التعليمية داخل رواق.",primary:"إضافة مسار",tabs:["المسارات","المراحل","المصادر"],stats:["مسارات نشطة","إجمالي المسارات","إجمالي المراحل","إجمالي الوحدات"],columns:["المسار","الوصف","الوحدات","الحالة"],seed:[]},
  reports:{title:"التقارير",subtitle:"أنشئ تقارير الحصص والساعات والطلاب مع إمكانية الطباعة والمشاركة.",primary:"إنشاء تقرير",tabs:["تقارير الطلاب","تقارير الحصص","تقارير المراكز"],stats:["تقارير الشهر","جاهزة للإرسال","مسودات","تمت مشاركتها"],columns:["التقرير","الطالب / الجهة","الفترة","الحالة"],seed:[]},
  alerts:{title:"التنبيهات والتذكيرات",subtitle:"نظّم تذكيرات الحصص والمراجعات والمهام الشخصية.",primary:"إضافة تنبيه",tabs:["التنبيهات","القادمة","السجل"],stats:["تنبيهات نشطة","اليوم","تمت قراءتها","مؤجلة"],columns:["التنبيه","الموعد","النوع","الحالة"],seed:[]},
  settings:{title:"الإعدادات",subtitle:"إدارة إعدادات الحساب واللغة والمنطقة الزمنية والتنبيهات.",primary:"حفظ التغييرات",tabs:["الحساب","التفضيلات","التنبيهات"],stats:["اللغة","المنطقة الزمنية","التذكيرات","الحساب"],columns:["الإعداد","القيمة","الوصف","الحالة"],seed:[{id:"language",title:"لغة الواجهة",subtitle:"اللغة الأساسية للتطبيق",status:"مفعل",value:"العربية"},{id:"timezone",title:"المنطقة الزمنية",subtitle:"تستخدم لحساب مواعيد الحصص",status:"مفعل",value:"Africa/Cairo"},{id:"reminder",title:"التذكير قبل الحصة",subtitle:"الإشعار التلقائي",status:"مفعل",value:"30 دقيقة"}]},
  "my-calendar":{title:"جدولي الشخصي",subtitle:"أضف مواعيدك الشخصية ومهام الحفظ والمراجعة بجانب حصص الطلاب.",primary:"إضافة موعد",tabs:["اليوم","الأسبوع","المواعيد الشخصية"],stats:["مواعيد اليوم","هذا الأسبوع","وقت متاح","تذكيرات"],columns:["الموعد","التاريخ","الوقت","الحالة"],seed:[]},
  lessons:{title:"الحصص",subtitle:"سجل الحصص القادمة والمنجزة واربط كل حصة بالطالب والساعات والتقرير.",primary:"تسجيل حصة",tabs:["هذا الشهر","المنجزة","السجل"],stats:["حصص الشهر","ساعات الشهر","منجزة","معلقة"],columns:["الحصة","الطالب","التاريخ","الحالة"],seed:[]}
};


const STORAGE_PREFIX="riwaq:module:";
const DB_KINDS=new Set<Kind>(["hours","lessons","reports","payments","paths"]);
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
  const [paymentStudentId,setPaymentStudentId]=useState("");
  const [paymentStudents,setPaymentStudents]=useState<{id:string;full_name:string}[]>([]);
  const [paymentCurrency,setPaymentCurrency]=useState("USD");


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

      if(kind==="paths"){
        const [pathResult,stageResult]=await Promise.all([
          supabase.from("educational_paths").select("id,title,description,category,stage_name,author_or_source,color,total_units_or_pages,status,legacy_id").order("title"),
          supabase.from("educational_path_stages").select("path_id").order("sort_order")
        ]);
        if(cancelled)return;
        if(pathResult.error){setNotice(pathResult.error.message);setRows([]);setLoadingState(false);return}
        const stageCounts:Record<string,number>={};
        (stageResult.data||[]).forEach((s:any)=>{stageCounts[s.path_id]=(stageCounts[s.path_id]||0)+1});
        setRows((pathResult.data||[]).map((p:any)=>({
          id:p.id,
          title:p.title,
          subtitle:p.description||p.stage_name||"بدون وصف",
          status:p.status==="active"?"نشط":"مؤرشف",
          value:`${Number(p.total_units_or_pages||0)} وحدة`,
          date:"",
          extra:JSON.stringify({...p,stage_count:stageCounts[p.id]||0})
        })));
        if(!cancelled){setHydrated(true);setLoadingState(false)}
        return;
      }
      if(kind==="payments"){
        const [paymentResult,studentResult]=await Promise.all([
          supabase.from("payments").select("id,student_id,student_name,month_year,billing_period,amount,amount_paid,total_due,currency_code,status,payment_method,payment_date,due_date,notes,hourly_rate,agreed_hours,actual_hours,total_hours_billed,legacy_student_id").order("month_year",{ascending:false}).order("student_name"),
          supabase.from("students").select("id,full_name").neq("status","archived").order("full_name")
        ]);
        const payments=paymentResult.data;
        const error=paymentResult.error;
        if(!cancelled)setPaymentStudents((studentResult.data||[]) as {id:string;full_name:string}[]);
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
      const eventIds=events.map((e:any)=>e.id);
      const participantsResult=eventIds.length?await supabase.from("event_students").select("event_id,student_id").in("event_id",eventIds):{data:[],error:null};
      if(participantsResult.error){setNotice(participantsResult.error.message);setRows([]);setLoadingState(false);return}
      const participantsByEvent:Record<string,string[]>={};
      (participantsResult.data||[]).forEach((row:any)=>{if(!participantsByEvent[row.event_id])participantsByEvent[row.event_id]=[];participantsByEvent[row.event_id].push(row.student_id)});
      const byStudent=Object.fromEntries(students.map(s=>[s.id,s]));
      if(kind==="hours"){
        const completed=events.filter(e=>e.status==="completed");
        const done:Record<string,number>={};
        completed.forEach(e=>{
          const h=Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);
          const ids=(participantsByEvent[e.id]?.length?participantsByEvent[e.id]:[e.student_id]).filter(Boolean) as string[];
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
          const ids=(participantsByEvent[e.id]?.length?participantsByEvent[e.id]:[e.student_id]).filter(Boolean) as string[];
          const participantNames=ids.map(id=>byStudent[id]?.full_name).filter(Boolean) as string[];
          let report="";
          try{report=JSON.parse(e.notes||"{}").report||""}catch{}
          const title=kind==="reports"?"تقرير — "+(participantNames.length?participantNames.join("، "):(student?.full_name||"طالب")):e.title;
          const status=kind==="reports"?(report.trim()?"جاهز":"مسودة"):(e.status==="completed"?"منجز":e.status==="pending"?"معلق":e.status==="cancelled"?"ملغى":"قادم");
          const hours=Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000);
          return {id:e.id,title,subtitle:participantNames.length?participantNames.join("، "):(student?.full_name||"طالب"),status,value:participantNames.length?participantNames.join("، "):(student?.full_name||"—"),date:formatArabicDate(e.starts_at,timezone),extra:kind==="lessons"?hours.toFixed(1):(report||e.title)};
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
      return [target.toFixed(1)+" ساعة",done.toFixed(1)+" ساعة",Math.max(0,target-done).toFixed(1)+" ساعة",String(rows.length)];
    }
    if(kind==="payments"){
      const values=rows.map(r=>parseRowJson(r.extra));
      const currencies=[...new Set(values.map(p=>String(p.currency_code||"")).filter(Boolean))];
      const formatMoney=(n:number)=>currencies.length===1?n.toFixed(2)+" "+currencies[0]:(currencies.length>1?"متعدد العملات":n.toFixed(2));
      const totalPaid=values.reduce((n,p)=>n+Number(p.amount_paid||0),0);
      const totalDue=values.reduce((n,p)=>n+Math.max(0,Number(p.amount||0)-Number(p.amount_paid||0)),0);
      const currentMonth=new Date().toISOString().slice(0,7);
      const monthPaid=values.filter(p=>p.month_year===currentMonth).reduce((n,p)=>n+Number(p.amount_paid||0),0);
      const pending=values.filter(p=>p.status==="unpaid"||p.status==="partial").length;
      return [formatMoney(totalPaid),formatMoney(totalDue),formatMoney(monthPaid),String(pending)];
    }
    if(kind==="exams") return [String(rows.length),"0","0%","0"];
    if(kind==="reports") return [String(rows.length),String(rows.filter(r=>r.status.includes("جاهز")).length),String(rows.filter(r=>r.status.includes("مسودة")).length),"0"];
    if(kind==="alerts") return [String(rows.filter(r=>r.status.includes("نشط")).length),"0","0","0"];
    if(kind==="lessons") return [String(rows.length),rows.reduce((n,r)=>n+(parseFloat(r.extra||"0")||0),0).toFixed(1)+" ساعة",String(rows.filter(r=>r.status.includes("منجز")).length),String(rows.filter(r=>r.status.includes("معلق")).length)];
    if(kind==="my-calendar") return ["0","0","—","0"];
    if(kind==="paths"){
      const paths=rows.map(r=>parseRowJson(r.extra));
      return [String(rows.filter(r=>r.status.includes("نشط")).length),String(rows.length),String(paths.reduce((n,p)=>n+Number(p.stage_count||0),0)),String(paths.reduce((n,p)=>n+Number(p.total_units_or_pages||0),0))];
    }
    return ["العربية","Africa/Cairo","30 دقيقة","نشط"];
  },[kind,rows]);

  const start=(row?:Row)=>{
    if(kind==="paths"){
      const p=row?parseRowJson(row.extra):{};
      setEditing(row||null);
      setForm(row
        ? {title:row.title,subtitle:row.subtitle,status:row.status,value:String(p.total_units_or_pages??"0"),date:"",extra:String(p.author_or_source||"")}
        : {title:"",subtitle:"",status:"نشط",value:"0",date:"",extra:""});
      setOpen(true);setNotice("");
      return;
    }
    if(kind==="payments"){
      const p=row?parseRowJson(row.extra):{};
      setPaymentStudentId(String(p.student_id||""));
      setPaymentCurrency(String(p.currency_code||"USD"));
      setEditing(row||null);
      setForm(row
        ? {title:row.title,subtitle:row.subtitle,status:row.status,value:String(p.amount??""),date:row.date||"",extra:String(p.amount_paid??"")}
        : {title:"",subtitle:new Date().toISOString().slice(0,7),status:"غير مدفوعة",value:"",date:"",extra:""});
      if(!row){setPaymentStudentId("");setPaymentCurrency("USD")}
      setOpen(true);setNotice("");
      return;
    }
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
    if(kind==="paths"){
      if(!form.title.trim())return setNotice("اكتب اسم المسار.");
      const total=Number(form.value||0);
      if(!Number.isFinite(total)||total<0||!Number.isInteger(total))return setNotice("عدد الوحدات يجب أن يكون رقمًا صحيحًا.");
      const {data:user}=await supabase.auth.getUser();
      if(!user.user)return setNotice("انتهت جلسة الدخول.");
      const previous=editing?parseRowJson(editing.extra):{};
      const payload={teacher_id:user.user.id,title:form.title.trim(),description:form.subtitle.trim()||null,category:previous.category||null,stage_name:previous.stage_name||null,author_or_source:form.extra.trim()||previous.author_or_source||null,color:previous.color||null,total_units_or_pages:total,status:form.status==="نشط"?"active":"archived",legacy_id:previous.legacy_id||null,legacy_data:previous.legacy_data||previous};
      const result=editing?await supabase.from("educational_paths").update(payload).eq("id",editing.id).select("id").single():await supabase.from("educational_paths").insert(payload).select("id").single();
      if(result.error)return setNotice(result.error.message);
      close();setNotice(editing?"تم تحديث المسار بنجاح.":"تمت إضافة المسار بنجاح.");
      const [refreshed,stageRefresh]=await Promise.all([
        supabase.from("educational_paths").select("id,title,description,category,stage_name,author_or_source,color,total_units_or_pages,status,legacy_id").order("title"),
        supabase.from("educational_path_stages").select("path_id")
      ]);
      if(!refreshed.error){
        const stageCounts:Record<string,number>={};
        (stageRefresh.data||[]).forEach((s:any)=>{stageCounts[s.path_id]=(stageCounts[s.path_id]||0)+1});
        setRows((refreshed.data||[]).map((p:any)=>({id:p.id,title:p.title,subtitle:p.description||p.stage_name||"بدون وصف",status:p.status==="active"?"نشط":"مؤرشف",value:`${Number(p.total_units_or_pages||0)} وحدة`,date:"",extra:JSON.stringify({...p,stage_count:stageCounts[p.id]||0})})));
      }
      return;
    }
    if(kind==="payments"){
      if(!form.title.trim())return setNotice("اكتب اسم الطالب.");
      const amount=Number(form.value);
      const amountPaid=Number(form.extra||0);
      if(!Number.isFinite(amount)||amount<0)return setNotice("اكتب مبلغًا صحيحًا.");
      if(!Number.isFinite(amountPaid)||amountPaid<0||amountPaid>amount)return setNotice("المبلغ المدفوع غير صحيح.");
      const month=/^\\d{4}-\\d{2}$/.test(form.subtitle.trim())?form.subtitle.trim():new Date().toISOString().slice(0,7);
      const status=amountPaid===0?"unpaid":amountPaid>=amount?"paid":"partial";
      const {data:user}=await supabase.auth.getUser();
      if(!user.user)return setNotice("انتهت جلسة الدخول.");
      const previous=editing?parseRowJson(editing.extra):{};
      const selectedPaymentStudent=paymentStudents.find(s=>s.id===paymentStudentId);
      const payload={
        teacher_id:user.user.id,
        student_id:paymentStudentId||previous.student_id||null,
        student_name:(selectedPaymentStudent?.full_name||form.title.trim()),
        legacy_student_id:previous.legacy_student_id||null,
        billing_period:previous.billing_period||null,
        month_year:month,
        hourly_rate:Number(previous.hourly_rate||0),
        agreed_hours:Number(previous.agreed_hours||0),
        actual_hours:Number(previous.actual_hours||0),
        total_hours_billed:Number(previous.total_hours_billed||0),
        amount:Number(amount.toFixed(2)),
        amount_paid:Number(amountPaid.toFixed(2)),
        total_due:Number(Math.max(0,amount-amountPaid).toFixed(2)),
        currency_code:paymentCurrency||previous.currency_code||"USD",
        status,
        payment_method:previous.payment_method||null,
        payment_date:form.date||null,
        due_date:previous.due_date||null,
        notes:previous.notes||null,
        legacy_data:previous.legacy_data||previous
      };
      const result=editing
        ? await supabase.from("payments").update(payload).eq("id",editing.id).select("id").single()
        : await supabase.from("payments").insert(payload).select("id").single();
      if(result.error)return setNotice(result.error.message);
      close();setNotice(editing?"تم تحديث الدفعة بنجاح.":"تم تسجيل الدفعة بنجاح.");
      const refreshed=await supabase.from("payments").select("id,student_id,student_name,month_year,billing_period,amount,amount_paid,total_due,currency_code,status,payment_method,payment_date,due_date,notes,hourly_rate,agreed_hours,actual_hours,total_hours_billed,legacy_student_id").order("month_year",{ascending:false}).order("student_name");
      if(!refreshed.error)setRows((refreshed.data||[]).map((p:any)=>({id:p.id,title:p.student_name,subtitle:p.month_year||p.billing_period||"بدون فترة",status:p.status==="paid"?"مدفوعة":p.status==="partial"?"مدفوعة جزئيًا":"غير مدفوعة",value:(Number(p.amount||0).toFixed(2)+" "+(p.currency_code||"")).trim(),date:p.payment_date||p.due_date||"",extra:JSON.stringify(p)})));
      return;
    }
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
      }else if(!value){return setNotice("اكتب قيمة الإعداد.");}else if(editing.id==="timezone"){try{new Intl.DateTimeFormat("en-US",{timeZone:value}).format();}catch{return setNotice("المنطقة الزمنية غير صالحة.");}}
      const nextSettings={...settings,[settingKey]:editing.id==="reminder"?Number(value):value};
      const {error}=await supabase.from("user_data").update({settings:nextSettings}).eq("user_id",user.user.id);
      if(error)return setNotice(error.message);
      setRows(prev=>prev.map(r=>r.id===editing.id?{...r,value:editing.id==="reminder"?value+" دقيقة":value}:r));
      close();setNotice("تم حفظ الإعداد بنجاح.");
      return;
    }
    if(!form.title.trim())return setNotice("اكتب عنوانًا أولًا.");
    const next:Row={id:editing?.id||crypto.randomUUID(),title:form.title.trim(),subtitle:form.subtitle.trim()||"بدون وصف",status:form.status,value:form.value||undefined,date:form.date||undefined,extra:form.extra||undefined};
    setRows(prev=>editing?prev.map(r=>r.id===editing.id?next:r):[next,...prev]);
    close();
    setNotice(editing?"تم تحديث العنصر بنجاح.":"تمت الإضافة بنجاح.");
  };
  const remove=async(id:string)=>{
    if(kind==="paths"){
      if(!confirm("هل تريد حذف هذا المسار؟"))return;
      const {error}=await supabase.from("educational_paths").delete().eq("id",id);
      if(error){setNotice(error.message);return}
      setRows(v=>v.filter(x=>x.id!==id));setNotice("تم حذف المسار.");
      return;
    }
    if(kind==="payments"){
      if(!confirm("هل تريد حذف هذه الدفعة؟"))return;
      const {error}=await supabase.from("payments").delete().eq("id",id);
      if(error){setNotice(error.message);return}
      setRows(v=>v.filter(x=>x.id!==id));setNotice("تم حذف الدفعة.");
      return;
    }
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
      <div className="management-table-wrap"><table className="management-table"><thead><tr>{c.columns.map(x=><th key={x}>{x}</th>)}<th></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><div className="table-title"><span className="table-icon"><Icon size={16}/></span><div><strong>{r.title}</strong><small>{r.subtitle}</small></div></div></td><td>{r.value||r.extra||"—"}</td><td>{r.date||"هذا الشهر"}</td><td><span className={`management-status ${/مكتمل|منجز|جاهز|مفعل|نشط|مدفوعة/.test(r.status)?"done":""}`}>{r.status}</span></td><td><div className="row-actions"><button onClick={()=>start(r)} title="تعديل"><Pencil size={15}/></button><button onClick={()=>remove(r.id)} title="حذف"><Trash2 size={15}/></button><button title="المزيد"><MoreHorizontal size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </section>

    {open&&<div className="management-modal-backdrop"><section className="management-modal">
      <header><div><span className="modal-icon"><Icon size={18}/></span><div><h2>{editing?"تعديل العنصر":c.primary}</h2><p>{c.title}</p></div></div><button onClick={close}><X size={19}/></button></header>
      <div className="management-form">
        {kind==="payments"?<>
          <label>الطالب
            <select value={paymentStudentId} onChange={e=>{setPaymentStudentId(e.target.value);const s=paymentStudents.find(x=>x.id===e.target.value);if(s)setForm(v=>({...v,title:s.full_name}))}}>
              <option value="">بدون ربط بطالب حالي</option>
              {paymentStudents.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </label>
          <label>اسم الطالب<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="اسم الطالب في السجل"/></label>
          <label>الفترة الشهرية<input type="month" value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})}/></label>
          <div className="two-fields">
            <label>إجمالي المبلغ<input type="number" min="0" step="0.01" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>
            <label>المبلغ المدفوع<input type="number" min="0" step="0.01" value={form.extra} onChange={e=>setForm({...form,extra:e.target.value})}/></label>
          </div>
          <label>العملة<input value={paymentCurrency} onChange={e=>setPaymentCurrency(e.target.value.toUpperCase().slice(0,5))} placeholder="USD" /></label>
          <label>تاريخ الدفع<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        </>:<>
          <label>العنوان<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="اكتب العنوان"/></label>
          <label>التفاصيل<textarea value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} placeholder="تفاصيل إضافية"/></label>
          <div className="two-fields">
            <label>الحالة<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>نشط</option><option>قادم</option><option>مكتمل</option><option>منجز</option><option>مسودة</option><option>معلق</option><option>مفعل</option><option>مؤرشف</option><option>جاهز</option></select></label>
            <label>القيمة<input value={form.value} onChange={e=>setForm({...form,value:e.target.value})} placeholder="—"/></label>
          </div>
          {(kind==="lessons"||kind==="alerts"||kind==="my-calendar"||kind==="reports")&&<label>التاريخ<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>}
          {(kind==="lessons"||kind==="reports"||kind==="exams")&&<label>ملاحظات إضافية<textarea value={form.extra} onChange={e=>setForm({...form,extra:e.target.value})}/></label>}
          {kind==="settings"&&<label>القيمة الجديدة<input value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></label>}
        </>}
      </div>
      <footer><button onClick={close}>إلغاء</button><button className="save" onClick={submit}><CheckCircle2 size={16}/> حفظ</button></footer>
    </section></div>}
  </main>;
}