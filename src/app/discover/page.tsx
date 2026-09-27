import type { Metadata, ResolvingMetadata } from "next";
import DiscoverClient from "./DiscoverClient";
import { getTranslations } from "@/i18n/server";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const t = await getTranslations();
  
  // Extract query, category, or city from searchParams
  const q = searchParams.q as string | undefined;
  const category = searchParams.category as string | undefined;
  const city = (searchParams.city || searchParams.location) as string | undefined;

  let title = t.seo.discoverTitle;
  let description = t.seo.discoverDesc;

  if (q) {
    title = t.seo.searchTitle.replace("{{query}}", q);
  } else if (category && city) {
    title = t.seo.categoryCityTitle.replace("{{category}}", category).replace("{{city}}", city);
  } else if (category) {
    title = t.seo.categoryTitle.replace("{{category}}", category);
  } else if (city) {
    title = t.seo.cityTitle.replace("{{city}}", city);
  }

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: "https://treeo.am/discover",
      siteName: "Treeo",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.jpg"],
    },
  };
}

export default function DiscoverPage() {
  return <DiscoverClient />;
}
