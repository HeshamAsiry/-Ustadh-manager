const pad=(n:number)=>String(n).padStart(2,"0");
const isoDate=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const emptyStudentForm=()=>({full_name:"",age:"",country_code:"",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,native_language:"",contact_phone:"",monthly_hours:"8",compensation_type:"virtual_currency",currency_code:"EUR",center_name:"",center_number:"",status:"active",notes:""});

export default function StudentsReference(){
 const [students,setStudents]=useState<Student[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[loading,setLoading]=useState(true),[query,setQuery]=useState("");
 const [teacherTimezone,setTeacherTimezone]=useState(defaultTeacherTimezone);
 const [studentModal,setStudentModal]=useState(false),[editing,setEditing]=useState<Student|null>(null),[lessonModal,setLessonModal]=useState(false),[lessonStudent,setLessonStudent]=useState<Student|null>(null),[lessonStudents,setLessonStudents]=useState<Student[]>([]),[message,setMessage]=useState("");
 const [studentMode,setStudentMode]=useState<"single"|"group">("single"),[groupName,setGroupName]=useState(""),[groupMembers,setGroupMembers]=useState<GroupMember[]>([{full_name:"",age:""},{full_name:"",age:""}]);
 const [studentForm,setStudentForm]=useState(emptyStudentForm());
 const [lessonForm,setLessonForm]=useState({date:isoDate(),time:"16:00",minutes:"60",status:"completed",rating:5,learned:"",report:"",homework:""});
 const load=async()=>{
  setLoading(true);
  const {data:user}=await supabase.auth.getUser();
  if(!user.user){setMessage("انتهت جلسة الدخول.");setLoading(false);return}
  const settingsResult=await supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle();
  const tz=settingsResult.data?.settings?.teacherTimeZone||settingsResult.data?.settings?.timezone||defaultTeacherTimezone;
  setTeacherTimezone(tz);
  const localNowParts=utcToTeacherParts(new Date().toISOString(),tz);
  const monthStart=localNowParts.date.slice(0,7)+"-01";
  const monthEndDate=new Date(monthStart+"T12:00:00");
  monthEndDate.setMonth(monthEndDate.getMonth()+1);
  const monthEnd=monthEndDate.getFullYear()+"-"+pad(monthEndDate.getMonth()+1)+"-"+pad(monthEndDate.getDate());
  const start=teacherWallClockToUtc(monthStart,"00:00",tz).toISOString();
  const end=teacherWallClockToUtc(monthEnd,"00:00",tz).toISOString();
  const [s,e]=await Promise.all([
   supabase.from("students").select("*").order("created_at",{ascending:false}),
   supabase.from("events").select("id,student_id,starts_at,ends_at,status,notes,title").eq("event_type","lesson").gte("starts_at",start).lt("starts_at",end).order("starts_at",{ascending:false})
  ]);
  if(s.error)setMessage(s.error.message);else setStudents((s.data||[]) as Student[]);
  if(!e.error)setLessons((e.data||[]) as Lesson[]);else setMessage(e.error.message);
  setLoading(false);
 };
 useEffect(()=>{void load()},[]);
 const hours=useMemo(()=>{
  const out:Record<string,number>={};
  lessons.filter(l=>l.status==="completed").forEach(l=>{
   const duration=Math.max(0,(new Date(l.ends_at).getTime()-new Date(l.starts_at).getTime())/3600000);
   let participants=[l.student_id];
   try{const parsed=JSON.parse(l.notes||"{}");if(Array.isArray(parsed.participants)&&parsed.participants.length)participants=parsed.participants;}catch{}
   participants.forEach(id=>out[id]=(out[id]||0)+duration);
  });
  return out;
 },[lessons]);
 const filtered=students.filter(s=>`${s.full_name} ${s.country_code||""}`.toLowerCase().includes(query.toLowerCase()));
 const groupMembersOf=(s:Student)=>s.group_id?students.filter(member=>member.group_id===s.group_id):[s];
 const openStudent=(s?:Student)=>{setEditing(s||null);setStudentMode("single");setGroupName("");setGroupMembers([{full_name:"",age:""},{full_name:"",age:""}]);setStudentForm(s?{full_name:s.full_name,age:String(s.age||""),country_code:s.country_code||"",timezone:s.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,native_language:s.native_language||"",contact_phone:s.contact_phone||"",monthly_hours:String(s.monthly_hours||8),compensation_type:s.compensation_type||"virtual_currency",currency_code:s.currency_code||"EUR",center_name:s.center_name||"",center_number:s.center_number||"",status:s.status||"active",notes:s.notes||""}:emptyStudentForm());setStudentModal(true)};
 const updateGroupMember=(index:number,field:keyof GroupMember,value:string)=>setGroupMembers(current=>current.map((member,i)=>i===index?{...member,[field]:value}:member));
 const addGroupMember=()=>setGroupMembers(current=>[...current,{full_name:"",age:""}]);
 const removeGroupMember=(index:number)=>setGroupMembers(current=>current.length>2?current.filter((_,i)=>i!==index):current);