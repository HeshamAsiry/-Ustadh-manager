"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, FileBarChart2, FileText, GraduationCap, LayoutDashboard, LogOut, Settings, WalletCards, BookOpen, ClipboardCheck, Users, Bell, BookMarked } from "lucide-react";
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  async function logout() {
    await supabase?.auth.signOut();
    window.location.replace("/login");
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><GraduationCap size={21}/></div><div>Ustadh Manager<small>إدارة التدريس والطلاب</small></div></div>
      <nav className="nav-groups">{groups.map(group => <div key={group.title} className="nav-group"><div className="nav-caption">{group.title}</div>{group.items.map(item => {const Icon=item.icon;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={active?"nav-link active":"nav-link"}><Icon size={17}/><span>{item.label}</span></Link>})}</div>)}</nav>
      <button className="logout-btn" onClick={logout}><LogOut size={17}/><span>تسجيل الخروج</span></button>
    </aside>
    <main className="main"><header className="topbar"><div><div className="eyebrow">Ustadh Manager</div><h1>إدارة التدريس</h1></div><div className="top-actions"><Link className="primary-btn" href="/students?action=new">+ طالب جديد</Link></div></header>{children}</main>
  </div>;
}
