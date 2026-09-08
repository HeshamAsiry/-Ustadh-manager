"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, BookOpenCheck, CalendarDays, Clock3, CreditCard, FileText, GraduationCap, LayoutDashboard, LogOut, Settings, Users, Waypoints } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "../app/dashboard/dashboard.css";

const items=[
  ["/dashboard","لوحة التحكم",LayoutDashboard],
  ["/students","الطلاب",Users],
  ["/calendar","التقويم",CalendarDays],
  ["/my-calendar","جدولي الشخصي",CalendarDays],
  ["/lessons","الحصص",BookOpenCheck],
  ["/quran","برنامج القرآن",BookOpen],
  ["/hours","الساعات",Clock3],
  ["/payments","المدفوعات",CreditCard],
  ["/exams","الاختبارات",GraduationCap],
  ["/educational-paths","المسارات التعليمية",Waypoints],
  ["/reports","التقارير",FileText],
  ["/alerts","التنبيهات",Bell],
] as const;

export default function AppNavigation(){
 const pathname=usePathname(); const router=useRouter(); const [signingOut,setSigningOut]=useState(false);
 const signOut=async()=>{setSigningOut(true);await supabase.auth.signOut();router.replace("/login")};
 return <aside className="sidebar app-sidebar"><div className="sidebar-brand"><div className="brand-symbol">ر</div><div><strong>رواق</strong><span>إدارة التعليم</span></div></div><nav className="main-nav" aria-label="الأقسام الرئيسية">{items.map(([href,label,Icon])=><a key={href} className={`nav-item ${pathname===href?"active":""}`} href={href}><Icon size={18}/><span>{label}</span></a>)}</nav><div className="sidebar-bottom"><a className={`nav-item ${pathname==="/settings"?"active":""}`} href="/settings"><Settings size={18}/><span>الإعدادات</span></a><button className="nav-item logout" onClick={signOut} disabled={signingOut}><LogOut size={18}/><span>{signingOut?"جارٍ الخروج...":"تسجيل الخروج"}</span></button></div></aside>
}