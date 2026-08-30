export type LessonReportInput = {
  studentName: string;
  studied: string;
  revision?: string;
  homework?: string;
  nextLesson?: string;
  notes?: string;
};

export function buildArabicReport(r: LessonReportInput) {
  return `السلام عليكم،\n\nتقرير حصة ${r.studentName}:\n\nما درسناه اليوم:\n${r.studied}\n\nالمراجعة:\n${r.revision || "لا يوجد"}\n\nالواجب المنزلي:\n${r.homework || "لا يوجد"}${r.nextLesson ? `\n\nالحصة القادمة:\n${r.nextLesson}` : ""}`;
}

export function buildTranslationPrompt(language: "fr" | "en", report: string) {
  const target = language === "fr" ? "French" : "English";
  return `Rewrite the following lesson report in natural, parent-friendly ${target}. Do not translate word-for-word. Preserve every educational and Islamic detail. Do not invent or omit information. Keep Quran surah names, Arabic names, hadith terminology and curriculum titles accurate. Return only the final report.\n\nREPORT:\n${report}`;
}
