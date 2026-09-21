export type PrintColumn = { key: string; label: string };

type PrintDocumentOptions = {
  title: string;
  subtitle?: string;
  period?: string;
  columns: PrintColumn[];
  rows: Record<string, unknown>[];
  filename?: string;
  summary?: Array<{ label: string; value: string }>;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const dateLabel = () =>
  new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

export function printRiwaqDocument(options: PrintDocumentOptions) {
  if (typeof window === "undefined") return;

  const {
    title,
    subtitle,
    period,
    columns,
    rows,
    summary = [],
  } = options;

  const tableHead = columns
    .map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`)
    .join("");

  const tableBody = rows.length
    ? rows
        .map(
          (row, index) =>
            `<tr><td class="index">${index + 1}</td>${columns
              .map((column) => `<td>${escapeHtml(row[column.key])}</td>`)
              .join("")}</tr>`,
        )
        .join("")
    : `<tr><td class="empty" colspan="${columns.length + 1}">لا توجد بيانات لعرضها.</td></tr>`;

  const summaryMarkup = summary.length
    ? `<section class="summary">${summary
        .map(
          (item) =>
            `<div class="summary-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`,
        )
        .join("")}</section>`
    : "";

  const documentHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 portrait; margin: 13mm 12mm 14mm; }
  :root { --border:#e1ded4; --text:#27352d; --muted:#6d7870; --olive:#526a58; --olive-strong:#3f5748; --surface:#fffdf8; }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; background:#fff; color:var(--text); }
  body { font-family:Arial,"Noto Sans Arabic","Tahoma",sans-serif; direction:rtl; -webkit-print-color-adjust:exact; print-color-adjust:exact; font-size:11px; line-height:1.65; }
  .sheet { width:100%; }
  .brand { display:flex; align-items:center; justify-content:space-between; gap:18px; padding-bottom:15px; border-bottom:2px solid var(--olive); }
  .brand-name { display:flex; align-items:center; gap:11px; }
  .mark { width:38px; height:38px; border-radius:11px; display:grid; place-items:center; background:linear-gradient(145deg,var(--olive-strong),var(--olive)); color:#fff; font-size:18px; font-weight:800; }
  .brand h1 { margin:0; font-size:21px; color:var(--olive-strong); }
  .meta { text-align:left; color:var(--muted); font-size:9px; }
  .heading { padding:17px 0 10px; }
  .heading h2 { margin:0; font-size:18px; color:var(--text); }
  .heading p { margin:4px 0 0; color:var(--muted); font-size:10px; }
  .period { display:inline-block; margin-top:8px; padding:5px 9px; border:1px solid var(--border); border-radius:999px; background:#faf8f2; color:var(--olive); font-size:9px; font-weight:700; }
  .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:8px 0 14px; }
  .summary-card { border:1px solid var(--border); border-radius:10px; background:var(--surface); padding:9px 10px; min-height:49px; }
  .summary-card span { display:block; color:var(--muted); font-size:8px; margin-bottom:3px; }
  .summary-card strong { display:block; color:var(--olive-strong); font-size:12px; }
  table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:10px; }
  thead { display:table-header-group; }
  tr { break-inside:avoid; }
  th { background:#eef1eb; color:#4e6054; font-size:9px; font-weight:800; padding:8px 7px; border:1px solid var(--border); text-align:right; }
  td { padding:7px; border:1px solid var(--border); font-size:9px; color:#46544b; vertical-align:top; word-break:break-word; }
  td.index { width:28px; text-align:center; color:#88928b; background:#faf8f2; }
  td.empty { text-align:center; padding:22px; color:#7c877f; }
  .footer { margin-top:16px; padding-top:9px; border-top:1px solid var(--border); display:flex; justify-content:space-between; gap:12px; color:#8b948d; font-size:8px; }
</style>
</head>
<body>
<div class="sheet">
  <header class="brand">
    <div class="brand-name"><div class="mark">ر</div><div><h1>رواق</h1><div style="font-size:9px;color:#7b867e;">إدارة التعليم</div></div></div>
    <div class="meta">تاريخ الاستخراج<br>${escapeHtml(dateLabel())}</div>
  </header>
  <section class="heading">
    <h2>${escapeHtml(title)}</h2>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    ${period ? `<span class="period">${escapeHtml(period)}</span>` : ""}
  </section>
  ${summaryMarkup}
  <table>
    <thead><tr><th style="width:28px">م</th>${tableHead}</tr></thead>
    <tbody>${tableBody}</tbody>
  </table>
  <footer class="footer"><span>رواق · مقرأة المعلم وإدارة التعليم</span><span>هذا المستند مُعدّ للطباعة أو الحفظ بصيغة PDF.</span></footer>
</div>
<script>
  window.addEventListener("load", () => setTimeout(() => window.print(), 120));
</script>
</body>
</html>`;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=1024,height=760");
  if (!popup) return;
  popup.document.write(documentHtml);
  popup.document.close();
}
