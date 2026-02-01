import FavoritesPage from "@/components/favorites/FavoritesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Favorites - DevBhakti",
    description: "Your curated list of sacred temples and divine rituals.",
};

export default function Page() {
    return <FavoritesPage />;
}
