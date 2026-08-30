# Ustadh Manager

A mobile-first teaching management app for Arabic, Quran and Islamic studies teachers.

## Agreed application structure
- Dashboard: active students, upcoming lessons, teaching hours, alerts and quick actions.
- Students: student profile, age, country, automatic timezone, languages, monthly hours, subjects and status.
- Calendar & Lessons: teacher calendar, student timezone, conflict prevention, lesson status and makeup lessons.
- Learning Paths: subject/curriculum/stage/progress per student.
- Quran: memorization, revision, mastery and notes.
- Exams: planning, scores, results and notes.
- Lesson Reports: taught/revision/homework/next lesson/private notes and parent-ready Arabic/French/English copy.
- Personal Schedule: preparation, revision, study, memorization and teacher blocks.
- Hours: monthly planned vs completed teaching hours.
- Payments: monthly dues, paid amount and payment history.
- Notifications: reminders and outstanding actions.
- Settings: teacher identity, locale, timezone, notifications and availability rules.
- Parent portal: future phase, not part of the current teacher application.

## Architecture
The application uses route-based modules instead of a single tab-driven page. Shared UI lives in `components/`, domain/data logic lives in `lib/`, and Supabase owns persistent multi-teacher data with RLS isolation.

## Stack
Next.js + TypeScript + Tailwind CSS + Supabase + Vercel.
