const TZ = "Europe/Tirane";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(iso: string) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(v("weekday"));
  return { day: `${DAYS[wd]}, ${v("day")}.${v("month")}`, time: `${v("hour")}:${v("minute")}` };
}
export const fmtDay = (iso: string) => parts(iso).day;
export const fmtTime = (iso: string) => parts(iso).time;
export const fmtDateTime = (iso: string) => { const p = parts(iso); return `${p.day} ${p.time}`; };
export function money(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
