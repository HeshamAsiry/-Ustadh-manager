export function timeZoneForCountry(country: string): string {
  const map: Record<string,string> = {
    مصر:"Africa/Cairo", Egypt:"Africa/Cairo", France:"Europe/Paris", فرنسا:"Europe/Paris",
    Belgium:"Europe/Brussels", بلجيكا:"Europe/Brussels", Netherlands:"Europe/Amsterdam", هولندا:"Europe/Amsterdam",
    UAE:"Asia/Dubai", الإمارات:"Asia/Dubai", "United Arab Emirates":"Asia/Dubai", UK:"Europe/London", "المملكة المتحدة":"Europe/London"
  };
  return map[country] ?? "UTC";
}

export function formatInZone(date: Date, timeZone: string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle:"medium", timeStyle:"short" }).format(date);
}

export function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}
