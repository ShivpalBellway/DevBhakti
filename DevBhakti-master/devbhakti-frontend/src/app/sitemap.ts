import { MetadataRoute } from "next";

const BASE_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://devbhakti.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/temples",
    "/poojas",
    "/donations",
    "/live-darshan",
    "/about",
    "/marketplace",
    "/products",
    "/contact",
    "/auth",
  ];

  const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Fetch dynamic temples for SEO sitemap
  let dynamicTemples: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/temples?lang=en`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      dynamicTemples = data.data.map((temple: any) => ({
        url: `${BASE_SITE_URL}/temples/${temple.slug || temple.id}`,
        lastModified: new Date(temple.updatedAt || Date.now()),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch temples for sitemap", error);
  }

  // Fetch dynamic poojas for SEO sitemap
  let dynamicPoojas: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/temples/poojas?lang=en`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      dynamicPoojas = data.data.map((pooja: any) => ({
        url: `${BASE_SITE_URL}/poojas/${pooja.slug || pooja.id}`,
        lastModified: new Date(pooja.updatedAt || Date.now()),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch poojas for sitemap", error);
  }

  return [...staticPages, ...dynamicTemples, ...dynamicPoojas];
}
