"use client";

import { useState } from "react";
import { BookOpen, CalendarDays } from "lucide-react";
import CalendarPage from "../../calendar/page";
import QuranProgram from "../../components/quran-program";
import "./my-calendar.css";

export default function MyCalendarPage(){
  const [view,setView]=useState<"calendar"|"quran">("calendar");
  return <main className="my-calendar-page" dir="rtl">
    <header className="my-calendar-topbar">
      <div className="my-calendar-heading">
        <span>مساحتي الشخصية</span>
        <h1>جدولي الشخصي</h1>
        <p>كل ما يخص جدولك كمعلم في مكان واحد: المواعيد والمهام وبرنامج القرآن الشخصي.</p>
      </div>
      <nav className="my-calendar-tabs" aria-label="أقسام الجدول الشخصي">
        <button className={view==="calendar"?"active":""} onClick={()=>setView("calendar")}><CalendarDays size={18}/> المواعيد</button>
        <button className={view==="quran"?"active":""} onClick={()=>setView("quran")}><BookOpen size={18}/> برنامج القرآن الخاص بي</button>
      </nav>
    </header>
    <section className="my-calendar-content">
      {view==="calendar" ? <CalendarPage/> : <QuranProgram/>}
    </section>
  </main>
}
