import { Suspense } from "react";
import DonationsClient from "./DonationsClient";

export default function AdminDonationsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-muted-foreground">Loading donations...</p>
                </div>
            }
        >
            <DonationsClient />
        </Suspense>
    );
}
