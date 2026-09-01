import { NextResponse } from "next/server";

const LANGUAGE_NAMES = { ar: "Arabic", fr: "French", en: "English" } as const;

type Body = {
  language?: keyof typeof LANGUAGE_NAMES;
  studentName?: string;
  taught?: string | null;
  review?: string | null;
  homework?: string | null;
  nextLesson?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const language = body.language;
    if (!language || !LANGUAGE_NAMES[language]) {
      return NextResponse.json({ error: "لغة الترجمة غير صحيحة." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "خدمة الترجمة غير مفعلة بعد. أضف OPENAI_API_KEY إلى متغيرات Vercel." }, { status: 503 });
    }

    const content = [
      `Student: ${body.studentName || "Student"}`,
      `Today’s lesson: ${body.taught || ""}`,
      `Revision: ${body.review || ""}`,
      `Homework: ${body.homework || ""}`,
      `Next lesson: ${body.nextLesson || ""}`,
    ].join("\n");

    const prompt = `Translate the following Quran/Arabic-language online lesson report into ${LANGUAGE_NAMES[language]}.

Requirements:
- Produce a polished, natural message suitable for a parent/guardian.
- Preserve the meaning exactly; do not invent progress, homework, or details.
- Keep Quran surah names, Arabic religious terminology, verse ranges, and tajweed terminology accurate. Do not translate Arabic names incorrectly.
- Use warm, professional educational language, not literal machine-translation phrasing.
- Keep the same four sections: today's lesson, revision, homework, next lesson.
- Return ONLY the finished message, with no explanation or quotation marks.

${content}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.6-luna",
        input: prompt,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("OpenAI translation error", response.status, details);
      return NextResponse.json({ error: "تعذر ترجمة التقرير الآن. حاول مرة أخرى." }, { status: 502 });
    }

    const data = await response.json();
    const text = typeof data.output_text === "string"
      ? data.output_text.trim()
      : (data.output || [])
          .flatMap((item: any) => item.content || [])
          .map((item: any) => item.text || "")
          .join("\n")
          .trim();

    if (!text) {
      return NextResponse.json({ error: "لم تُرجع خدمة الترجمة نصًا." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Report translation failed", error);
    return NextResponse.json({ error: "حدث خطأ أثناء ترجمة التقرير." }, { status: 500 });
  }
}
