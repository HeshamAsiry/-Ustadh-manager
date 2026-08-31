"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Clock3, FileBarChart2, FileText, LayoutDashboard, LogOut, Settings, WalletCards, BookOpen, ClipboardCheck, Users, Bell, BookMarked, Menu, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const groups = [
  { title: "الرئيسية", items: [{ href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard }] },
  { title: "التدريس", items: [
    { href: "/students", label: "الطلاب", icon: Users },
    { href: "/calendar", label: "التقويم والحصص", icon: CalendarDays },
    { href: "/learning-paths", label: "المسارات التعليمية", icon: BookMarked },
    { href: "/quran", label: "القرآن والتقدم", icon: BookOpen },
    { href: "/exams", label: "الاختبارات", icon: ClipboardCheck },
    { href: "/reports", label: "تقارير الحصص", icon: FileText },
  ]},
  { title: "الإدارة", items: [
    { href: "/schedule", label: "جدولي الشخصي", icon: Clock3 },
    { href: "/hours", label: "الساعات", icon: FileBarChart2 },
    { href: "/payments", label: "المدفوعات", icon: WalletCards },
    { href: "/notifications", label: "التنبيهات", icon: Bell },
    { href: "/settings", label: "الإعدادات", icon: Settings },
  ]},
];
const DASHBOARD_LOGO = "https://media.githubusercontent.com/media/HeshamAsiry/-Ustadh-manager/main/dashboard%20logo.png";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  async function logout() { await supabase?.auth.signOut(); window.location.replace("/login"); }
  const Brand = ({mobile=false}:{mobile?:boolean}) => <div className={mobile ? "brand brand-image mobile-brand" : "brand brand-image"}><img src={DASHBOARD_LOGO} alt="رِواق" /><div><span>رِواق</span><small>إدارة التدريس والطلاب</small></div></div>;
  const nav = (mobile = false) => <nav className={mobile ? "nav-groups mobile-nav-groups" : "nav-groups"}>{groups.map(group => <div key={group.title} className="nav-group"><div className="nav-caption">{group.title}</div>{group.items.map(item => {const Icon=item.icon;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} onClick={()=>mobile&&setMobileOpen(false)} className={active?"nav-link active":"nav-link"}><Icon size={17}/><span>{item.label}</span></Link>})}</div>)}</nav>;
  return <div className="app-shell">
    <aside className="sidebar"><Brand />{nav()}<button className="logout-btn" onClick={logout}><LogOut size={17}/><span>تسجيل الخروج</span></button></aside>
    {mobileOpen && <div className="mobile-menu-backdrop" onClick={()=>setMobileOpen(false)} />}
    <aside className={mobileOpen ? "mobile-sidebar open" : "mobile-sidebar"} aria-hidden={!mobileOpen}><div className="mobile-sidebar-head"><Brand mobile/><button className="icon-btn" aria-label="إغلاق القائمة" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>{nav(true)}<button className="logout-btn" onClick={logout}><LogOut size={17}/><span>تسجيل الخروج</span></button></aside>
    <main className="main"><header className="topbar"><div className="mobile-header"><button className="mobile-menu-btn" aria-label="فتح القائمة" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div><div className="eyebrow">رِواق</div><h1>إدارة التدريس</h1></div></div><div className="desktop-title"><div className="eyebrow">رِواق</div><h1>إدارة التدريس</h1></div><div className="top-actions"><Link className="primary-btn" href="/students?action=new">+ طالب جديد</Link></div></header>{children}</main>
    <style jsx global>{`@media (max-width:800px){.desktop-title{display:none}.mobile-header{display:flex;align-items:center;gap:10px}.mobile-menu-btn{width:42px;height:42px;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:11px;display:grid;place-items:center;box-shadow:0 2px 8px rgba(25,45,28,.05)}.mobile-sidebar{position:fixed;z-index:200;top:0;right:0;bottom:0;width:min(310px,88vw);background:#fff;border-left:1px solid var(--line);padding:15px;display:flex;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;box-shadow:-15px 0 40px rgba(25,45,28,.12)}.mobile-sidebar.open{transform:translateX(0)}.mobile-sidebar-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:10px}.mobile-sidebar .brand{padding:0;font-size:16px}.mobile-sidebar .brand small{font-size:10px}.mobile-nav-groups{overflow:auto;padding-bottom:15px}.mobile-sidebar .logout-btn{margin-top:auto}.mobile-menu-backdrop{position:fixed;z-index:190;inset:0;background:rgba(20,30,23,.4);backdrop-filter:blur(2px)}}@media(min-width:801px){.mobile-header,.mobile-sidebar,.mobile-menu-backdrop,.mobile-menu-btn{display:none!important}.desktop-title{display:block}}.brand-image{display:flex;align-items:center;gap:10px}.brand-image img{width:42px;height:42px;object-fit:contain;border-radius:10px}.brand-image>div{display:flex;flex-direction:column}.brand-image span{font-weight:800}.brand-image small{font-size:11px;color:var(--muted);margin-top:2px}.mobile-brand img{width:36px;height:36px}`}</style>
  </div>;
}