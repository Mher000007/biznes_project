import { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://findy.am';

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/discover',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  let businessPages: MetadataRoute.Sitemap = [];
  
  try {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";
    // Fetch businesses. For a huge DB, we'd use generateSitemaps() to split into multiple files,
    // but a single sitemap.xml can handle 50,000 URLs which is sufficient for now.
    const res = await fetch(`${apiURL}/businesses?limit=50000`, { 
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    const data = await res.json();
    if (data?.success && Array.isArray(data?.data)) {
      businessPages = data.data.map((biz: any) => ({
        url: `${baseUrl}/business/${biz.slug}`,
        lastModified: new Date(biz.updatedAt || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch businesses for sitemap:", err);
  }

  // Combine and return all sitemap entries
  return [...staticPages, ...categoryPages, ...businessPages];
}
