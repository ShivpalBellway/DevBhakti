"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyProductRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/marketplace/product/${params.id}`);
    } else {
      router.replace("/marketplace");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <div className="w-10 h-10 border-4 border-[#7c4624] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#7c4624]">Loading Product...</p>
      </div>
    </div>
  );
}
