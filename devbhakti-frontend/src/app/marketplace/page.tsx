import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import MarketplaceClient from "./MarketplaceClient";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Sacred Marketplace | DevBhakti - Authentic Devotional Items",
    description: "Shop for authentic idols, incense, spiritual books, and pooja essentials. Blessed items delivered directly from sacred temples to your doorstep.",
    keywords: "spiritual marketplace, pooja items online, hindu idols, blessed gifts India",
  };

  return getPageMetadata("marketplace", fallback);
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Sacred Marketplace...</div>}>
      <MarketplaceClient />
    </Suspense>
  );
}
