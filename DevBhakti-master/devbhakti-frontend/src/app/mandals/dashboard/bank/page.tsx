"use client";

import React from "react";
import { Building2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MandalBankPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                    Bank Details
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your mandal's bank account for payouts and settlements.
                </p>
            </div>

            <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#7b4623]/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-[#7b4623]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Bank Details Management</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Add your mandal's bank account details to enable direct payouts and settlements.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                        <Info className="w-4 h-4 shrink-0" />
                        Bank details management coming soon. Please contact support to add your bank account.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
