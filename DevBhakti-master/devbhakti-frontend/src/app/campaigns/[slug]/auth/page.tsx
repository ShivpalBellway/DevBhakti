"use client";

import { use } from "react";
import ContestAuthForm from "@/components/auth/ContestAuthForm";

export default function CampaignAuthPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    return <ContestAuthForm slug={resolvedParams.slug} />;
}
