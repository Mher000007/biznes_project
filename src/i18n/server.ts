import { cookies } from "next/headers";
import { en } from "./en";
import { hy } from "./hy";
import { ru } from "./ru";
import { Locale } from "./index";

const dictionaries: Record<Locale, typeof en> = { en, hy, ru };

export async function getTranslations() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
  return dictionaries[locale] || dictionaries.en;
}

export async function getLocale() {
  const cookieStore = await cookies();
  return (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "en";
}
