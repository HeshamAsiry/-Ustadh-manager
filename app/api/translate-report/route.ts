import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LANGUAGE_NAMES = { ar: "Arabic", fr: "French", en: "English" } as const;
type Body = { language?: keyof typeof LANGUAGE_NAMES; studentName?: string; taught?: string | null; review?: string | null; homework?: string | null; nextLesson?: string | null };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const language = body.language;
    if (!language || !LANGUAGE_NAMES[language]) return NextResponse.json({ error: "لغة الترجمة غير صحيحة." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "خدمة الترجمة غير مفعلة بعد. أضف GEMINI_API_KEY إلى متغيرات Vercel." }, { status: 503 });

    const prompt = `You are a professional translator for an online Quran and Arabic-language teacher. Translate this lesson report into ${LANGUAGE_NAMES[language]} for the student's parent.
Rules:
- Write naturally, warmly, and professionally; never translate word-for-word.
- Preserve the student's name exactly.
- Preserve Quran surah names, ayah numbers, Arabic religious terms, and tajweed terminology accurately. Do not invent information.
- Preserve the exact meaning and all educational details.
- Do not add facts or advice that are not in the source.
- Return ONLY the finished parent-facing message, with clear headings.
- If the target is Arabic, use polished Modern Standard Arabic.

Student: ${body.studentName || "Student"}
Today's lesson: ${body.taught || "—"}
Revision: ${body.review || "—"}
Homework: ${body.homework || "—"}
Next lesson: ${body.nextLesson || "—"}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 1200 } }),
    });

    const data = await response.json();
    if (!response.ok) { console.error("Gemini translation error", response.status, data); return NextResponse.json({ error: "تعذر ترجمة التقرير الآن. حاول مرة أخرى." }, { status: 502 }); }

    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim();
    if (!text) return NextResponse.json({ error: "لم تُرجع خدمة الترجمة نصًا." }, { status: 502 });
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Report translation failed", error);
    return NextResponse.json({ error: "حدث خطأ أثناء ترجمة التقرير." }, { status: 500 });
  }
}
