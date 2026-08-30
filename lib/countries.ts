export const COUNTRIES = [
  { code: "BE", name: "بلجيكا", timezone: "Europe/Brussels" },
  { code: "FR", name: "فرنسا", timezone: "Europe/Paris" },
  { code: "NL", name: "هولندا", timezone: "Europe/Amsterdam" },
  { code: "DE", name: "ألمانيا", timezone: "Europe/Berlin" },
  { code: "GB", name: "المملكة المتحدة", timezone: "Europe/London" },
  { code: "CH", name: "سويسرا", timezone: "Europe/Zurich" },
  { code: "CA", name: "كندا", timezone: "America/Toronto" },
  { code: "US", name: "الولايات المتحدة", timezone: "America/New_York" },
  { code: "AE", name: "الإمارات", timezone: "Asia/Dubai" },
  { code: "SA", name: "السعودية", timezone: "Asia/Riyadh" },
  { code: "EG", name: "مصر", timezone: "Africa/Cairo" },
  { code: "MA", name: "المغرب", timezone: "Africa/Casablanca" },
  { code: "DZ", name: "الجزائر", timezone: "Africa/Algiers" },
  { code: "TN", name: "تونس", timezone: "Africa/Tunis" },
  { code: "TR", name: "تركيا", timezone: "Europe/Istanbul" },
  { code: "AU", name: "أستراليا", timezone: "Australia/Sydney" },
] as const;

export function countryTimezone(code: string | null | undefined) {
  return COUNTRIES.find((country) => country.code === code)?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function countryName(code: string | null | undefined) {
  return COUNTRIES.find((country) => country.code === code)?.name ?? code ?? "—";
}
