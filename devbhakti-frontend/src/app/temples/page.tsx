import { Metadata } from 'next';
import { getPageMetadata } from "@/lib/seo";
import { TemplesList } from '@/components/temples/TemplesList';

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: 'Browse Temples - DevBhakti',
    description: 'Explore sacred temples across India. Book poojas, watch live darshan, and connect with divine experiences.',
  };

  return getPageMetadata("temple-list", fallback);
}

export default function TemplesPage() {
  return <TemplesList />;
}
