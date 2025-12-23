import type { Metadata } from 'next';
import { TemplesList } from '@/components/temples/TemplesList';

export const metadata: Metadata = {
  title: 'Browse Temples - DevBhakti',
  description: 'Explore sacred temples across India. Book poojas, watch live darshan, and connect with divine experiences.',
};

export default function TemplesPage() {
  return <TemplesList />;
}
