type GoogleCalendarEvent = {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  timezone: string;
  details?: string | null;
};

const toUtc = (date: string, time: string, timezone: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const base = Date.UTC(year, month - 1, day, hour, minute);

  const offsetAt = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(ms));

    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    return Math.round(
      (Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - ms) / 60000,
    );
  };

  const candidate = base - offsetAt(base) * 60000;
  return new Date(base - offsetAt(candidate) * 60000);
};

const compactUtc = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export function googleCalendarEventUrl(event: GoogleCalendarEvent) {
  const start = toUtc(event.date, event.time, event.timezone);
  const end = new Date(start.getTime() + event.durationMinutes * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${compactUtc(start)}/${compactUtc(end)}`,
    stz: event.timezone,
    etz: event.timezone,
  });

  if (event.details?.trim()) params.set("details", event.details.trim());

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
