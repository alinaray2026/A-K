const TZ = "Europe/Rome"; // same offset as Berlin

function parts(iso: string, days: string[]) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(v("weekday"));
  return { day: `${days[wd]}, ${v("day")}.${v("month")}`, time: `${v("hour")}:${v("minute")}` };
}
export const fmtDay = (iso: string, days: string[]) => parts(iso, days).day;
export const fmtTime = (iso: string) => parts(iso, ["", "", "", "", "", "", ""]).time;
export const fmtDateTime = (iso: string, days: string[]) => { const p = parts(iso, days); return `${p.day} ${p.time}`; };

/** 1234.5 → "1,234.50" (en) or "1.234,50" (it/de). */
export function money(n: number, locale = "en") {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const sep = locale === "en" ? [",", "."] : [".", ","];
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, sep[0]) + sep[1] + dec;
}
/** Decimal odds: 2.50 / 2,50 */
export function price(n: number, locale = "en") {
  return locale === "en" ? n.toFixed(2) : n.toFixed(2).replace(".", ",");
}
