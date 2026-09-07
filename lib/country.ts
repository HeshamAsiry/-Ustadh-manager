export const countryFlag=(code?:string|null)=>{
  const normalized=(code||"").trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(normalized)) return "🌍";
  return String.fromCodePoint(...normalized.split("").map(c=>127397+c.charCodeAt(0)));
};
