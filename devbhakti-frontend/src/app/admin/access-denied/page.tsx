"use client";

import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccessDeniedPage() {
    const router = useRouter();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 animate-pulse">
                <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                You don't have the required permissions to access this page.
                Please contact your administrator if you believe this is an error.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border rounded-lg font-medium hover:bg-muted/50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
                <Link
                    href="/admin"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    <Home className="w-4 h-4" /> Dashboard
                </Link>
            </div>
        </div>
    );
}
