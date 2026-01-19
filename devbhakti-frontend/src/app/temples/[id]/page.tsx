import TempleDetailClient from "./TempleDetailClient";
import { temples } from "@/data/temples";

export async function generateStaticParams() {
  return temples.map((temple) => ({
    id: temple.id.toString(),
  }));
}

export default function TempleDetailPage() {
  return <TempleDetailClient />;
}
