function offsetMinutesAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(date);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  const match = raw.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === "+" ? minutes : -minutes;
}

export function zonedDateTimeToUtc(datePart: string, timePart: string, timeZone: string) {
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) throw new Error("التاريخ أو الوقت غير صحيح");
  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i += 1) {
    const offset = offsetMinutesAt(new Date(guess), timeZone);
    const adjusted = Date.UTC(year, month - 1, day, hour, minute, 0) - offset * 60000;
    if (adjusted === guess) break;
    guess = adjusted;
  }
  return new Date(guess);
}

export function formatInTimeZone(value: string | Date, timeZone: string, locale = "ar-EG") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTimeInZone(value: string | Date, timeZone: string, locale = "ar-EG") {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
