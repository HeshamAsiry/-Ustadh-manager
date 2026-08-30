export type TimeSlot = { start: Date; end: Date };

/** True when two time ranges overlap. Endpoints touching is allowed. */
export function hasOverlap(a: TimeSlot, b: TimeSlot) {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

export function durationMinutes(slot: TimeSlot) {
  return Math.max(0, Math.round((slot.end.getTime() - slot.start.getTime()) / 60000));
}

export function monthHours(slots: TimeSlot[], year: number, month: number) {
  const total = slots
    .filter(s => s.start.getFullYear() === year && s.start.getMonth() === month)
    .reduce((sum, s) => sum + durationMinutes(s), 0);
  return total / 60;
}

export function toDateTime(date: string, time: string, timeZone: string) {
  // The application stores scheduled timestamps as UTC in PostgreSQL.
  // Conversion to/from a named IANA timezone should be performed by the UI
  // using Intl/Temporal before persisting the final ISO timestamp.
  return { date, time, timeZone };
}
