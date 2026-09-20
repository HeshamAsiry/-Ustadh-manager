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
const DB_KINDS=new Set<Kind>(["hours","lessons","reports"]);
const readLocal=(kind:Kind,seed:Row[])=>{try{const raw=localStorage.getItem(STORAGE_PREFIX+kind);return raw?JSON.parse(raw):seed}catch{return seed}};
const writeCloudRows=async(kind:Kind,rows:Row[])=>{
  const {error}=await supabase.rpc("set_management_module",{p_kind:kind,p_rows:rows});
  if(error)setNotice(error.message);
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
const formatArabicDate=(iso:string,timezone:string)=>{
  const p=partsInZone(iso,timezone);
  return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(new Date(p.date+"T12:00:00"));
};


export default function ManagementModule({kind}:{kind:Kind}){
  const c=config[kind], Icon=icons[kind];
  const [rows,setRows]=useState<Row[]>([]),[query,setQuery]=useState(""),[tab,setTab]=useState(0),[loadingState,setLoadingState]=useState(true),[hydrated,setHydrated]=useState(false);
  const [open,setOpen]=useState(false),[editing,setEditing]=useState<Row|null>(null),[notice,setNotice]=useState("");
  const [form,setForm]=useState({title:"",subtitle:"",status:"نشط",value:"",date:"",extra:""});
