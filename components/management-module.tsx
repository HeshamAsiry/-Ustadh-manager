const STORAGE_PREFIX="riwaq:module:";
const DB_KINDS=new Set<Kind>(["hours","lessons","reports"]);
const readLocal=(kind:Kind,seed:Row[])=>{try{const raw=localStorage.getItem(STORAGE_PREFIX+kind);return raw?JSON.parse(raw):seed}catch{return seed}};
const writeCloudRows=async(kind:Kind,rows:Row[])=>{
  const {error}=await supabase.rpc("set_management_module",{p_kind:kind,p_rows:rows});
  return error||null;
};


const partsInZone=(iso:string,timezone:string)=>{
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));
  const get=(type:string)=>parts.find(part=>part.type===type)?.value||"";
  return {date:get("year")+"-"+get("month")+"-"+get("day"),time:get("hour")+":"+get("minute")};
};
const wallClockToUtc=(date:string,time:string,timezone:string)=>{
  const d=date.split("-").map(Number), t=time.split(":").map(Number);
  const base=Date.UTC(d[0],d[1]-1,d[2],t[0],t[1]);
  const offsetAt=(ms:number)=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(ms));
    const get=(x:string)=>Number(parts.find(part=>part.type===x)?.value||0);
    return Math.round((Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"))-ms)/60000);
  };
  const candidate=base-offsetAt(base)*60000;
  return new Date(base-offsetAt(candidate)*60000);
};
const formatArabicDate=(iso:string,timezone:string)=>{
  const p=partsInZone(iso,timezone);
  return new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",year:"numeric"}).format(new Date(p.date+"T12:00:00"));
};


export default function ManagementModule({kind}:{kind:Kind}){
  const c=config[kind], Icon=icons[kind];
  const [rows,setRows]=useState<Row[]>([]),[query,setQuery]=useState(""),[tab,setTab]=useState(0),[loadingState,setLoadingState]=useState(true),[hydrated,setHydrated]=useState(false);
  const [open,setOpen]=useState(false),[editing,setEditing]=useState<Row|null>(null),[notice,setNotice]=useState("");
  const [form,setForm]=useState({title:"",subtitle:"",status:"نشط",value:"",date:"",extra:""});