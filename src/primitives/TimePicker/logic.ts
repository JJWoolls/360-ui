/* TimePicker arithmetic — pure, so it is testable without a DOM. */

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The list of "HH:MM" options from startHour:00 to endHour:00 inclusive,
 * every `interval` minutes. 7 / 17 / 30 -> 07:00 ... 17:00 (21 options).
 */
export function timeOptions(startHour = 7, endHour = 17, interval = 30): string[] {
  const step = Math.max(1, Math.floor(interval));
  const out: string[] = [];
  for (let t = startHour * 60; t <= endHour * 60; t += step) {
    out.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
  }
  return out;
}

/** "14:30" -> "2:30 PM". Anything unparseable comes back unchanged. */
export function formatTime12(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}
