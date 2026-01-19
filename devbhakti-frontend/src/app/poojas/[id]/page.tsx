import React from "react";
import { poojas } from "@/data/poojas";
import PoojaDetailClient from "./PoojaDetailClient";

export function generateStaticParams() {
    return poojas.map((pooja) => ({
        id: pooja.id,
    }));
}

interface PageProps {
    params: Promise<{ id: string }>;
}

const PoojaDetailPage = async ({ params }: PageProps) => {
    const { id } = await params;
    return <PoojaDetailClient id={id} />;
};

export default PoojaDetailPage;
