      supabase.from("events").select("id,student_id,title,starts_at,ends_at,status").eq("event_type","lesson").order("starts_at"),
      supabase.from("user_data").select("settings").eq("user_id",user.user.id).maybeSingle()
    ]);
    if(studentResult.error)setMessage(studentResult.error.message);
    const studentRows=(studentResult.data||[]) as Student[];
    setStudents(studentRows);
    const tz=userDataResult.data?.settings?.teacherTimeZone||userDataResult.data?.settings?.timezone||"Africa/Cairo";
    setTeacherTimezone(tz);
    if(eventResult.error){setMessage(eventResult.error.message);setAppointments([]);}
    else{
      const byId:Record<string,Student>=Object.fromEntries(studentRows.map(s=>[s.id,s]));
      const eventRows=(eventResult.data||[]) as Array<{id:string;student_id:string|null;title:string|null;starts_at:string;ends_at:string;status:string}>;
      const eventIds=eventRows.map(e=>e.id);
      let participantRows:Array<{event_id:string;student_id:string}> = [];
      if(eventIds.length){
        const participantResult=await supabase.from("event_students").select("event_id,student_id").in("event_id",eventIds);
        if(participantResult.error)setMessage(participantResult.error.message);
        else participantRows=(participantResult.data||[]) as Array<{event_id:string;student_id:string}>;
      }
      const participantsByEvent:Record<string,string[]>={};
      participantRows.forEach(row=>{
        if(!participantsByEvent[row.event_id])participantsByEvent[row.event_id]=[];
        participantsByEvent[row.event_id].push(row.student_id);
      });
      setAppointments(eventRows.map((e)=>{
        const ids=(participantsByEvent[e.id]&&participantsByEvent[e.id].length?participantsByEvent[e.id]:(e.student_id?[e.student_id]:[]));
        const names=ids.map((id)=>byId[id]?.full_name).filter((name):name is string=>Boolean(name));
        const primary=ids[0]?byId[ids[0]]:undefined;
        const parts=zonedParts(e.starts_at,tz), endParts=zonedParts(e.ends_at,tz);
        const duration=Math.max(0,Math.round((new Date(e.ends_at).getTime()-new Date(e.starts_at).getTime())/60000));
        const code=primary?.country_code||"";
        return {
          id:e.id,
          date:parts.date,
          time:parts.time,
          end:endParts.time,
          studentId:e.student_id,
          studentIds:ids,
          student:names.length>1?names.join("، "):(names[0]||"طالب محذوف"),
          country:countryName(code),
          countryCode:code,