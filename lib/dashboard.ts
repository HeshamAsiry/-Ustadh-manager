import { supabase } from "./supabase";

export async function getDashboardStats(from:string,to:string){
 if(!supabase) throw new Error("Supabase is not configured");
 const {data:user,error:authError}=await supabase.auth.getUser();
 if(authError||!user.user) throw new Error("Authentication required");
 const teacher_id=user.user.id;
 const [{count:students},{data:events},{data:reports},{data:homework},{data:exams}] = await Promise.all([
  supabase.from("students").select("id",{count:"exact",head:true}).eq("teacher_id",teacher_id),
  supabase.from("events").select("id,starts_at,ends_at,status,student_id").eq("teacher_id",teacher_id).gte("starts_at",from).lt("starts_at",to),
  supabase.from("lesson_reports").select("id").eq("teacher_id",teacher_id).gte("created_at",from).lt("created_at",to),
  supabase.from("homework").select("id,status,due_date").eq("teacher_id",teacher_id),
  supabase.from("exams").select("id,status,scheduled_at").eq("teacher_id",teacher_id).gte("scheduled_at",from).lt("scheduled_at",to)
 ]);
 const completed=(events??[]).filter(e=>e.status==="completed");
 const hours=completed.reduce((s,e)=>s+Math.max(0,(new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/3600000),0);
 return {students:students??0,lessons:events??[],completedLessons:completed.length,hours,reports:reports?.length??0,homeworkPending:(homework??[]).filter(x=>x.status!=="completed").length,exams:exams?.length??0};
}
