"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, Clock3, FileText, GraduationCap, LayoutDashboard, LogOut, Plus, Settings, Users, BookOpenCheck, Bell, UserRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./dashboard.css";

type Lesson = {
  time: string;
  end: string;
  student: string;
  subject: string;
  status: "next" | "upcoming";
  note?: string;
};

const lessons: Lesson[] = [
  { time: "14:00", end: "14:45", student: "هارون", subject: "القرآن الكريم", status: "next", note: "مراجعة الحفظ والتلاوة" },
  { time: "16:00", end: "16:45", student: "فاضل", subject: "القرآن الكريم", status: "upcoming", note: "تسميع ومراجعة" },
];

const quickLinks = [
  { href: "/students", label: "الطلاب", detail: "إدارة الطلاب وملفاتهم", icon: Users },
  { href: "/calendar", label: "التقويم", detail: "الحصص والمواعيد", icon: CalendarDays },
  { href: "/lessons", label: "الحصص", detail: "تسجيل ومتابعة الحصص", icon: BookOpenCheck },
  { href: "/reports", label: "التقارير", detail: "التقارير والإنجازات", icon: FileText },
];

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }

    const client = supabase;
    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) router.replace("/login");
      else setChecking(false);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const monthLabel = useMemo(() => "سبتمبر ٢٠٢٦", []);

  const signOut = async () => {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checking) {
    return <main className="dashboard-loading" dir="rtl"><div className="loading-card"><div className="loading-mark">ر</div><p>جارٍ تحميل لوحة التحكم...</p></div></main>;
  }

  return (
    <main className="dashboard-shell" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">ر</div>
          <div><strong>رواق</strong><span>إدارة التعليم</span></div>
        </div>

        <nav className="main-nav" aria-label="الأقسام الرئيسية">
          <a className="nav-item active" href="/dashboard"><LayoutDashboard size={18} /><span>لوحة التحكم</span></a>
          <a className="nav-item" href="/students"><Users size={18} /><span>الطلاب</span><b>7</b></a>
          <a className="nav-item" href="/calendar"><CalendarDays size={18} /><span>التقويم</span></a>
          <a className="nav-item" href="/lessons"><BookOpenCheck size={18} /><span>الحصص</span></a>
          <a className="nav-item" href="/reports"><FileText size={18} /><span>التقارير</span></a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="/settings"><Settings size={18} /><span>الإعدادات</span></a>
          <button className="nav-item logout" onClick={signOut} disabled={signingOut}><LogOut size={18} /><span>{signingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}</span></button>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">لوحة المعلم</p>
            <h1>مقرأة المعلم</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="التنبيهات"><Bell size={19} /><i /></button>
            <div className="profile-chip"><span className="avatar"><UserRound size={17} /></span><span>المعلم</span></div>
          </div>
        </header>

        <div className="welcome-card">
          <div>
            <span className="welcome-kicker">السلام عليكم ورحمة الله وبركاته</span>
            <h2>اليوم هو <strong>السبت</strong>، لديك <strong>2 حصص تدريس</strong> و<strong>0 مواعيد شخصية</strong> في جدولك.</h2>
            <p>كل مواعيد الطلاب معروضة بتوقيتك المحلي، مع مراعاة فروق التوقيت تلقائيًا.</p>
          </div>
          <div className="welcome-actions">
            <a className="secondary-button" href="/calendar"><CalendarDays size={17} /> عرض التقويم الكامل</a>
            <a className="primary-button" href="/students"><Users size={17} /> إدارة الطلاب <span>(7)</span></a>
          </div>
        </div>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-index">01</span><h2>الموعد القادم</h2></div><a href="/calendar">عرض الجدول <ChevronLeft size={15} /></a></div>
          <div className="next-card">
            <div className="next-time"><span>القادمة</span><strong>14:00</strong><small>إلى 14:45</small></div>
            <div className="next-divider" />
            <div className="next-info"><span className="status-pill"><span /> بعد قليل</span><h3>حصة القرآن الكريم — هارون</h3><p><Clock3 size={15} /> بعد الموعد الحالي: 0 مواعيد شخصية</p></div>
            <a className="arrow-button" href="/lessons"><ArrowLeft size={19} /></a>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-index">02</span><h2>ملخص نشاط اليوم</h2></div></div>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-icon"><GraduationCap size={19} /></span><div><strong>2</strong><span>حصص اليوم</span></div></div>
            <div className="stat-card"><span className="stat-icon"><Clock3 size={19} /></span><div><strong>1:30</strong><span>ساعة تدريس</span></div></div>
            <div className="stat-card"><span className="stat-icon"><CheckCircle2 size={19} /></span><div><strong>0</strong><span>حصص مكتملة</span></div></div>
            <div className="stat-card"><span className="stat-icon"><Bell size={19} /></span><div><strong>0</strong><span>مواعيد شخصية</span></div></div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-index">03</span><h2>جدول مواعيد اليوم بالتفصيل</h2></div><span className="muted-label">السبت · ٥ سبتمبر</span></div>
          <div className="schedule-card">
            {lessons.map((lesson, index) => (
              <div className="schedule-row" key={`${lesson.time}-${lesson.student}`}>
                <div className="schedule-time"><strong>{lesson.time}</strong><span>{lesson.end}</span></div>
                <div className={`timeline-dot ${lesson.status}`} />
                <div className="schedule-main"><div><h3>{lesson.student}</h3><span>{lesson.subject}</span></div><p>{lesson.note}</p></div>
                <span className={`lesson-badge ${lesson.status === "next" ? "now" : ""}`}>{lesson.status === "next" ? "القادم" : "لاحقًا"}</span>
              </div>
            ))}
            <div className="schedule-footer"><Clock3 size={16} /><span>يتم ترتيب الحصص بحسب التوقيت، مع مراعاة فرق التوقيت للطلاب في الخارج.</span></div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><span className="section-index">04</span><h2>إحصائيات وإنجازات الشهر الحالي</h2></div><a href="/reports">عرض التقارير الموسعة <ChevronLeft size={15} /></a></div>
          <div className="month-card">
            <div className="month-head"><div><span>الشهر الحالي</span><h3>{monthLabel}</h3></div><a href="/reports">التفاصيل <ArrowLeft size={15} /></a></div>
            <div className="month-stats"><div><strong>—</strong><span>إجمالي ساعات التدريس</span></div><div><strong>—</strong><span>الحصص المكتملة</span></div><div><strong>—</strong><span>الطلاب النشطون</span></div><div><strong>—</strong><span>متوسط الحضور</span></div></div>
            <div className="progress-note"><span>تُحدّث الإحصائيات تلقائيًا مع تسجيل الحصص والتقارير.</span><a href="/lessons"><Plus size={15} /> تسجيل حصة</a></div>
          </div>
        </section>

        <section className="section-block quick-section">
          <div className="section-heading"><div><span className="section-index">05</span><h2>الوصول السريع للأقسام الرئيسية</h2></div></div>
          <div className="quick-grid">
            {quickLinks.map(({ href, label, detail, icon: Icon }) => <a className="quick-card" href={href} key={href}><span className="quick-icon"><Icon size={20} /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronLeft size={17} /></a>)}
          </div>
        </section>

        <footer className="dashboard-footer">رواق · مقرأة المعلم وإدارة التعليم</footer>
      </section>
    </main>
  );
}
