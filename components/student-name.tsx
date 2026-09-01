"use client";
import "./student-name.css";

export const FLAGS: Record<string,string> = {
  EG:"🇪🇬", FR:"🇫🇷", BE:"🇧🇪", NL:"🇳🇱", DE:"🇩🇪", GB:"🇬🇧", US:"🇺🇸", CA:"🇨🇦", CH:"🇨🇭", AT:"🇦🇹", ES:"🇪🇸", IT:"🇮🇹", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰", FI:"🇫🇮", MA:"🇲🇦", DZ:"🇩🇿", TN:"🇹🇳", LY:"🇱🇾", SA:"🇸🇦", AE:"🇦🇪", QA:"🇶🇦", KW:"🇰🇼", BH:"🇧🇭", OM:"🇴🇲", JO:"🇯🇴", TR:"🇹🇷", MY:"🇲🇾", AU:"🇦🇺"
};
export function countryFlag(code?: string | null) { return code ? FLAGS[code.toUpperCase()] || "" : ""; }
export function CountryFlag({ code, className = "" }: { code?: string | null; className?: string }) { const flag = countryFlag(code); return flag ? <span className={`student-country-flag ${className}`} aria-label={code || undefined}>{flag}</span> : null; }
export default function StudentName({ name, countryCode, className = "", flagClassName = "" }: { name: string; countryCode?: string | null; className?: string; flagClassName?: string }) { return <span className={`student-name-with-country ${className}`}><span>{name}</span><CountryFlag code={countryCode} className={flagClassName}/></span>; }
