"use client";
import { useTransition } from "react";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLang } from "../actions";

export default function LangSwitcher({ current }: { current: Lang }) {
  const [pending, start] = useTransition();
  return (
    <div className="langs" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={l === current} disabled={pending}
          onClick={() => start(() => setLang(l))}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
