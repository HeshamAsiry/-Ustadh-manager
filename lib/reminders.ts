export type Reminder = { id:string; title:string; startsAt:string; minutesBefore:number };

export function reminderForLesson(lesson:{id:string;starts_at:string;student_name?:string}, minutesBefore=30):Reminder {
  return { id:`lesson-${lesson.id}`, title:`Lesson${lesson.student_name ? ` — ${lesson.student_name}` : ""}`, startsAt:lesson.starts_at, minutesBefore };
}

export function reminderTime(startsAt:string, minutesBefore=30) {
  return new Date(new Date(startsAt).getTime() - minutesBefore*60000);
}
