"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, Download, X } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

export function FloatingDownloadApp() {
    const pathname = usePathname();

    const PLAY_STORE_URL = "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
    const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248";

    // Hide the floating widget on all admin, seller, and dashboard routes
    const isAdminRoute = pathname?.startsWith('/admin') || 
                         pathname?.includes('/dashboard') || 
                         pathname?.startsWith('/seller');
                         
    if (isAdminRoute) return null;

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 select-none">
            <HoverCard openDelay={0} closeDelay={150}>
                <HoverCardTrigger asChild>
                    <button
                        aria-label="Download DevBhakti App"
                        className="flex items-center gap-2 bg-gradient-to-l from-[#7b4623] via-[#94552c] to-[#7b4623] text-white px-3 py-2.5 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 hover:pr-4 transition-all duration-300 transform hover:-translate-x-1 group cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5 font-black text-xs tracking-wide">
                            <Smartphone className="w-4 h-4 text-amber-200" />
                            <span>Download App</span>
                        </div>
                    </button>
                </HoverCardTrigger>
                <HoverCardContent 
                    side="left" 
                    align="center" 
                    className="w-72 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/50 shadow-2xl space-y-3 mr-2"
                >
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[#7b4623]" />
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Get DevBhakti App</h4>
                        </div>
                    </div>

                    {/* <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Choose your platform to download the official DevBhakti App:
                    </p> */}

                    <div className="space-y-2 pt-1">
                        {/* Android / Play Store Option */}
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:border-emerald-800 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Android App</div>
                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Get it on Google Play</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                        </a>

                        {/* iOS / App Store Option */}
                        <a
                            href={APP_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-sky-950/30 dark:border-sky-800 transition-all group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-slate-900 text-white shrink-0">
                                    <Download className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">iOS App</div>
                                    <div className="text-[10px] text-sky-700 dark:text-sky-400 font-medium">Download on App Store</div>
                                </div>
                            </div>
                            <Download className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>
                </HoverCardContent>
            </HoverCard>
        </div>
    );
}
