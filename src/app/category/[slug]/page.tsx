import type { Metadata, ResolvingMetadata } from "next";
import CategoryClient from "./CategoryClient";
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

  const title = t.seo.categoryTitle.replace("{{category}}", name);
  const description = t.seo.homeDesc;
  const url = `https://findy.am/category/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `https://findy.am/en/category/${slug}`,
        hy: `https://findy.am/hy/category/${slug}`,
        ru: `https://findy.am/ru/category/${slug}`,
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

export default async function CategoryPage(props: Props) {
  const params = await props.params;
  return <CategoryClient category={params.slug} />;
}
