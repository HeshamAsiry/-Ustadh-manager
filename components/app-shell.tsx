"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Clock3, FileBarChart2, FileText, LayoutDashboard, LogOut, Settings, WalletCards, BookOpen, ClipboardCheck, Users, Bell, BookMarked, Menu, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const items = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/students", label: "الطلاب", icon: Users },
  { href: "/learning-paths", label: "المسارات التعليمية", icon: BookMarked },
  { href: "/quran", label: "القرآن", icon: BookOpen },
  { href: "/exams", label: "الاختبارات", icon: ClipboardCheck },
  { href: "/schedule", label: "جدولي الشخصي", icon: Clock3 },
  { href: "/hours", label: "الساعات", icon: FileBarChart2 },
  { href: "/payments", label: "المدفوعات", icon: WalletCards },
  { href: "/reports", label: "التقارير", icon: FileText },
  { href: "/notifications", label: "التنبيهات", icon: Bell },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const DASHBOARD_LOGO = "/dashboard-logo.png";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase?.auth.signOut();
    window.location.replace("/login");
  }

  const Nav = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? "ustadh-nav ustadh-mobile-nav" : "ustadh-nav"} aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} onClick={() => mobile && setMobileOpen(false)} className={active ? "ustadh-nav-link active" : "ustadh-nav-link"}>
            <Icon size={16} strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="app-shell ustadh-shell">
      <header className="ustadh-topbar">
        <div className="ustadh-topbar-inner">
          <Link href="/dashboard" className="ustadh-brand" aria-label="رِواق - الرئيسية">
            <img src={DASHBOARD_LOGO} alt="رِواق" />
            <div><b>رِواق</b><span>إدارة التدريس والطلاب</span></div>
          </Link>
          <div className="ustadh-top-action"><Link className="primary-btn" href="/students?action=new">+ طالب جديد</Link></div>
          <button className="ustadh-mobile-menu" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        </div>
        <div className="ustadh-nav-wrap"><Nav /></div>
      </header>
      {mobileOpen && <div className="ustadh-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={mobileOpen ? "ustadh-mobile-drawer open" : "ustadh-mobile-drawer"} aria-hidden={!mobileOpen}>
        <div className="ustadh-mobile-head">
          <Link href="/dashboard" className="ustadh-brand" onClick={() => setMobileOpen(false)}><img src={DASHBOARD_LOGO} alt="رِواق" /><div><b>رِواق</b><span>إدارة التدريس والطلاب</span></div></Link>
          <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="إغلاق"><X size={18} /></button>
        </div>
        <Nav mobile />
        <button className="logout-btn" onClick={logout}><LogOut size={17} /><span>تسجيل الخروج</span></button>
      </aside>
      <main className="main ustadh-main">{children}</main>
      <style jsx global>{`
        .ustadh-shell{min-height:100vh;background:var(--bg)}
        .ustadh-topbar{position:sticky;top:0;z-index:80;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
        .ustadh-topbar-inner{height:72px;max-width:1500px;margin:auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .ustadh-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);min-width:190px}.ustadh-brand img{width:42px;height:42px;object-fit:contain}.ustadh-brand b{display:block;font-size:18px;line-height:1.2}.ustadh-brand span{display:block;color:var(--muted);font-size:10px;margin-top:3px}
        .ustadh-nav-wrap{border-top:1px solid #f0f2ee;background:#fff}.ustadh-nav{max-width:1500px;margin:auto;padding:7px 28px;display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}.ustadh-nav::-webkit-scrollbar{display:none}
        .ustadh-nav-link{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:11px;color:#68736b;text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap;transition:background .16s ease,color .16s ease,transform .16s ease}.ustadh-nav-link:hover{background:var(--soft);color:var(--accent-dark);transform:translateY(-1px)}.ustadh-nav-link.active{background:var(--accent);color:#fff;box-shadow:0 4px 12px rgba(102,121,91,.18)}
        .ustadh-main{margin:0 auto;width:100%;max-width:1500px;padding:28px 32px 55px}.ustadh-mobile-menu{display:none;border:1px solid var(--line);background:#fff;color:var(--ink);width:42px;height:42px;border-radius:11px;place-items:center}.ustadh-mobile-drawer,.ustadh-mobile-backdrop{display:none}
        @media(max-width:800px){.ustadh-topbar-inner{height:62px;padding:0 13px}.ustadh-brand{min-width:0}.ustadh-brand img{width:38px;height:38px}.ustadh-brand b{font-size:16px}.ustadh-brand span{font-size:9px}.ustadh-top-action{display:none}.ustadh-nav-wrap{display:none}.ustadh-mobile-menu{display:grid}.ustadh-main{padding:18px 13px 35px}.ustadh-mobile-backdrop{display:block;position:fixed;inset:0;background:rgba(20,30,23,.38);backdrop-filter:blur(2px);z-index:190}.ustadh-mobile-drawer{display:flex;position:fixed;z-index:200;top:0;right:0;bottom:0;width:min(320px,88vw);background:#fff;border-left:1px solid var(--line);padding:14px;flex-direction:column;transform:translateX(105%);transition:transform .22s ease;box-shadow:-20px 0 50px rgba(25,45,28,.14)}.ustadh-mobile-drawer.open{transform:translateX(0)}.ustadh-mobile-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:13px;margin-bottom:8px;border-bottom:1px solid var(--line)}.ustadh-mobile-nav{display:flex;flex-direction:column;align-items:stretch;overflow:auto;padding:5px 0}.ustadh-mobile-nav .ustadh-nav-link{padding:12px 13px}.ustadh-mobile-drawer .logout-btn{margin-top:auto}}
      `}</style>
    </div>
  );
}
