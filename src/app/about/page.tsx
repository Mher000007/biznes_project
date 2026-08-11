import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t.seo.aboutTitle,
    description: t.seo.aboutDesc,
    alternates: {
      canonical: "https://findy.am/about",
      languages: {
        en: "https://findy.am/en/about",
        hy: "https://findy.am/hy/about",
        ru: "https://findy.am/ru/about",
        "x-default": "https://findy.am/about",
      },
    }
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
