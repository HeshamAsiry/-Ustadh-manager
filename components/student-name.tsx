"use client";

const FLAGS: Record<string,string> = {
  EG:"🇪🇬", FR:"🇫🇷", BE:"🇧🇪", NL:"🇳🇱", DE:"🇩🇪", GB:"🇬🇧", US:"🇺🇸", CA:"🇨🇦", CH:"🇨🇭", AT:"🇦🇹", ES:"🇪🇸", IT:"🇮🇹", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰", FI:"🇫🇮", MA:"🇲🇦", DZ:"🇩🇿", TN:"🇹🇳", LY:"🇱🇾", SA:"🇸🇦", AE:"🇦🇪", QA:"🇶🇦", KW:"🇰🇼", BH:"🇧🇭", OM:"🇴🇲", JO:"🇯🇴", TR:"🇹🇷", MY:"🇲🇾", AU:"🇦🇺"
};

export function countryFlag(code?: string | null) {
  if (!code) return "";
  return FLAGS[code.toUpperCase()] || "";
}

export default function StudentName({ name, countryCode, className = "", flagClassName = "" }: { name: string; countryCode?: string | null; className?: string; flagClassName?: string }) {
  const flag = countryFlag(countryCode);
  return <span className={`student-name-with-country ${className}`}><span>{name}</span>{flag && <span className={`student-country-flag ${flagClassName}`} aria-label={countryCode || undefined}>{flag}</span>}</span>;
}
