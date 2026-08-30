export const locales = ["ar", "fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const translations = {
  ar: { dashboard:"الرئيسية", calendar:"التقويم", students:"الطلاب", learning:"المسارات التعليمية", quran:"القرآن", exams:"الاختبارات", personal:"جدولي الشخصي", hours:"الساعات", payments:"المدفوعات", reports:"التقارير", notifications:"التنبيهات", settings:"الإعدادات", newStudent:"طالب جديد", today:"اليوم", upcoming:"قادم", completed:"منتهية", available:"متاح", cancel:"إلغاء", save:"حفظ", copy:"نسخ", report:"تقرير الحصة" },
  fr: { dashboard:"Tableau de bord", calendar:"Calendrier", students:"Élèves", learning:"Parcours pédagogiques", quran:"Coran", exams:"Évaluations", personal:"Mon planning", hours:"Heures", payments:"Paiements", reports:"Rapports", notifications:"Notifications", settings:"Paramètres", newStudent:"Nouvel élève", today:"Aujourd’hui", upcoming:"À venir", completed:"Terminée", available:"Disponible", cancel:"Annuler", save:"Enregistrer", copy:"Copier", report:"Compte rendu du cours" },
  en: { dashboard:"Dashboard", calendar:"Calendar", students:"Students", learning:"Learning paths", quran:"Quran", exams:"Assessments", personal:"My schedule", hours:"Hours", payments:"Payments", reports:"Reports", notifications:"Notifications", settings:"Settings", newStudent:"New student", today:"Today", upcoming:"Upcoming", completed:"Completed", available:"Available", cancel:"Cancel", save:"Save", copy:"Copy", report:"Lesson report" },
} as const;

export function getDirection(locale: Locale) { return locale === "ar" ? "rtl" : "ltr"; }
