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