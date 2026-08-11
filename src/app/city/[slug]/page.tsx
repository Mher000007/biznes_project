import type { Metadata, ResolvingMetadata } from "next";
import CityClient from "./CityClient";
import { getTranslations } from "@/i18n/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations();
  const slug = params.slug;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  const title = t.seo.cityTitle.replace("{{city}}", name);
  const description = t.seo.homeDesc;
  const url = `https://findy.am/city/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `https://findy.am/en/city/${slug}`,
        hy: `https://findy.am/hy/city/${slug}`,
        ru: `https://findy.am/ru/city/${slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function CityPage(props: Props) {
  const params = await props.params;
  return <CityClient city={params.slug} />;
}
