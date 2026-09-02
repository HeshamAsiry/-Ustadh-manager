"use client";
import "./student-name.css";

export function countryFlag(code?: string | null) {
  const value = code?.trim().toUpperCase();
  if (!value || !/^[A-Z]{2}$/.test(value)) return "";
  return String.fromCodePoint(...[...value].map(char => 127397 + char.charCodeAt(0)));
}

export function CountryFlag({ code, className = "" }: { code?: string | null; className?: string }) {
  const flag = countryFlag(code);
  return flag ? <span className={`student-country-flag ${className}`.trim()} aria-label={code || undefined}>{flag}</span> : null;
}

export default function StudentName({ name, countryCode, className = "", flagClassName = "" }: { name: string; countryCode?: string | null; className?: string; flagClassName?: string }) {
  return <span className={`student-name-with-country ${className}`.trim()}><span>{name}</span><CountryFlag code={countryCode} className={flagClassName}/></span>;
}
