import { Suspense } from "react";
import MandalDonationClient from "./MandalDonationClient";

export default function MandalDonationsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-muted-foreground">Loading donations...</p>
                </div>
            }
        >
            <MandalDonationClient />
        </Suspense>
    );
}
