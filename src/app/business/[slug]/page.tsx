import type { Metadata, ResolvingMetadata } from "next";
import BusinessProfileClient from "./BusinessProfileClient";
import { getTranslations } from "@/i18n/server";
import { getApiUrl } from "@/lib/utils";

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

  let business: any = null;
  
  // Try to fetch business from backend
  try {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";
    const res = await fetch(`${apiURL}/businesses/slug/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const data = await res.json();
    if (data?.success && data?.data) {
      business = data.data;
    }
  } catch (err) {
    console.warn("Could not fetch business for metadata:", err);
  }

  // If not found (or in a mock environment without backend), fallback
  if (!business) {
    const nameFromSlug = slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      title: `${nameFromSlug} | Findy`,
      description: t.seo.businessDesc.replace("{{description}}", nameFromSlug),
    };
  }

  const name = business.name || "Business";
  const categoryName = typeof business.category === "object" ? business.category?.name : business.category || "Business";
  const city = business.city || "Yerevan";
  
  // Format description
  const rawDesc = business.description || business.metadata?.description || business.shortDescription || "";
  const shortDesc = rawDesc.length > 150 ? rawDesc.substring(0, 150) + "..." : rawDesc;
  const description = shortDesc || t.seo.businessDesc.replace("{{description}}", `Find ${name} services in ${city} on Findy.`);
  
  // Generate title by replacing placeholders
  const title = t.seo.businessTitle
    .replace("{{name}}", name)
    .replace("{{category}}", categoryName)
    .replace("{{city}}", city);

  // Extract cover image
  let image = "/og-default.jpg";
  if (business.coverImageUrl && typeof business.coverImageUrl === 'string' && !business.coverImageUrl.includes('photo-')) {
    image = business.coverImageUrl;
  } else if (business.logo && typeof business.logo === 'string' && !business.logo.includes('photo-')) {
    image = business.logo;
  } else if (business.images && business.images.length > 0) {
    image = business.images[0];
  }
  
  const currentUrl = `https://findy.am/business/${slug}`;

  // JSON-LD Schema
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "description": description,
    "url": currentUrl,
    "image": image,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressCountry": "AM"
    },
    ...(business.coordinates?.latitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": business.coordinates.latitude,
        "longitude": business.coordinates.longitude
      }
    })
  };

  return {
    title,
    description,
    alternates: {
      canonical: currentUrl,
      languages: {
        en: `https://findy.am/en/business/${slug}`,
        hy: `https://findy.am/hy/business/${slug}`,
        ru: `https://findy.am/ru/business/${slug}`,
        "x-default": currentUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: "Findy",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "script:ld+json": JSON.stringify(structuredData),
    },
  };
}

export default function BusinessProfilePageWrapper() {
  return <BusinessProfileClient />;
}
