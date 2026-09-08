"use client";

import { useState } from "react";
import { CalendarDays, BookOpen, Clock3 } from "lucide-react";
import QuranProgram from "../../components/quran-program";
import "../quran/quran.css";

export default function MyCalendarPage(){
  const [view,setView]=useState<"calendar"|"quran">("calendar");
  return <main className="personal-calendar-page" dir="rtl">
    <header className="personal-calendar-header">
      <div>
        <span className="eyebrow">مساحتي الشخصية</span>
        <h1>جدولي الشخصي</h1>
        <p>مواعيدك الشخصية، مهامك، وخطة القرآن الخاصة بك كمعلم.</p>
      </div>
      <div className="personal-calendar-tabs">
        <button className={view==="calendar"?"active":""} onClick={()=>setView("calendar")}><CalendarDays size={17}/> المواعيد</button>
        <button className={view==="quran"?"active":""} onClick={()=>setView("quran")}><BookOpen size={17}/> برنامج القرآن الخاص بي</button>
      </div>
    </header>
    {view==="quran" ? <QuranProgram/> : <section className="personal-calendar-placeholder">
      <div className="personal-calendar-card"><CalendarDays size={28}/><h2>التقويم الشخصي</h2><p>هنا ستظهر مواعيدك الشخصية وحصص الطلاب والمهام الناتجة من برنامج القرآن في تقويم واحد.</p><div className="personal-calendar-note"><Clock3 size={17}/><span>برنامج القرآن أصبح جزءًا من جدولي الشخصي وليس قسمًا مستقلًا.</span></div></div>
    </section>}
  </main>
}
