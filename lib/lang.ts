import { cookies, headers } from "next/headers";
import { DICTS, pickLang, type Lang } from "./i18n.ts";

export async function getLang(): Promise<Lang> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return pickLang(c.get("lang")?.value, h.get("accept-language"));
}

export async function getDict() {
  return DICTS[await getLang()];
}
