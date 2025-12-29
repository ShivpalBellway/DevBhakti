import TempleDetailClient from "./TempleDetailClient";

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function TempleDetailPage() {
  return <TempleDetailClient />;
}
