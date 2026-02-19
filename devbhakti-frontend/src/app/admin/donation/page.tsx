import { Suspense } from "react";
import DonationClient from "./DonationClient";

export default function AdminDonationsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-muted-foreground">Loading donation...</p>
                </div>
            }
        >
            <DonationClient />
        </Suspense>
    );
}
