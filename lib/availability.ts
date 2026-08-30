import { supabase } from "./supabase";

export async function getAvailability(teacherId:string, from:string, to:string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const [{data:lessons,error:lerr},{data:events,error:eerr}] = await Promise.all([
    supabase.from("events").select("id,starts_at,ends_at,status").eq("teacher_id",teacherId).lt("starts_at",to).gt("ends_at",from),
    supabase.from("personal_events").select("id,starts_at,ends_at").eq("teacher_id",teacherId).lt("starts_at",to).gt("ends_at",from)
  ]);
  return { blocked:[...(lessons??[]),...(events??[])], error:lerr||eerr };
}

export function findFreeSlots(dayStart:Date, dayEnd:Date, durationMinutes:number, blocked:{starts_at:string;ends_at:string}[], stepMinutes=30) {
  const out:{start:Date;end:Date}[]=[];
  for(let t=dayStart.getTime(); t+durationMinutes*60000<=dayEnd.getTime(); t+=stepMinutes*60000){
    const start=new Date(t), end=new Date(t+durationMinutes*60000);
    if(!blocked.some(b=>start<new Date(b.ends_at)&&new Date(b.starts_at)<end)) out.push({start,end});
  }
  return out;
}
