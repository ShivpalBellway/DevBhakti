import { Metadata } from "next";
import { fetchSeoSettings } from "@/api/publicController";

/**
 * Fetches dynamic SEO metadata from the backend for a specific page.
 * Falls back to provided static metadata if no setting is found or on error.
 */
export async function getPageMetadata(pageKey: string, fallback: Metadata): Promise<Metadata> {
  try {
    const response = await fetchSeoSettings();
    if (response.success && response.settings && response.settings[pageKey]) {
      const seo = response.settings[pageKey];
      
      // Merge found SEO settings with the fallback
      return {
        ...fallback,
        title: seo.title || fallback.title,
        description: seo.description || fallback.description,
        keywords: seo.keywords || fallback.keywords,
        openGraph: {
          ...fallback.openGraph,
          title: seo.title || fallback.openGraph?.title,
          description: seo.description || fallback.openGraph?.description,
        },
        twitter: {
          ...fallback.twitter,
          title: seo.title || fallback.twitter?.title,
          description: seo.description || fallback.twitter?.description,
        }
      };
    }
  } catch (error) {
    console.error(`[SEO] Error generating metadata for "${pageKey}":`, error);
  }
  
  return fallback;
}
