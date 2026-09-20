import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t.seo.aboutTitle,
    description: t.seo.aboutDesc,
    alternates: {
      canonical: "https://treeo.am/about",
      languages: {
        en: "https://treeo.am/en/about",
        hy: "https://treeo.am/hy/about",
        ru: "https://treeo.am/ru/about",
        "x-default": "https://treeo.am/about",
      },
    }
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
