"use client";

import React from "react";
import { Users, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MandalUsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                    Devotee Management
                </h1>
                <p className="text-muted-foreground mt-1">
                    View devotees who have donated or interacted with your mandal.
                </p>
            </div>

            <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#7b4623]/10 flex items-center justify-center">
                        <Users className="w-8 h-8 text-[#7b4623]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Devotee data available via Donations</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Devotee details such as donor name, phone, and email are available within each donation record.
                            Visit the <strong>Donation</strong> section to view them.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                        <Info className="w-4 h-4 shrink-0" />
                        Full devotee management coming soon.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
