"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, Download, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

export function FloatingDownloadApp() {
    const pathname = usePathname();
    const { toast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [userOs, setUserOs] = useState<"android" | "ios" | "other">("other");
    const isMobile = useMediaQuery("(max-width: 640px)");

    const PLAY_STORE_URL = "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
    const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248";

    useEffect(() => {
        if (typeof window !== "undefined") {
            const ua = navigator.userAgent;
            if (/android/i.test(ua)) {
                setUserOs("android");
            } else if (/iphone|ipad|ipod/i.test(ua)) {
                setUserOs("ios");
            }
        }
    }, []);

    // Hide the floating widget on all admin, seller, and dashboard routes
    const isAdminRoute = pathname?.startsWith('/admin') || 
                         pathname?.includes('/dashboard') || 
                         pathname?.startsWith('/seller');
                         
    if (isAdminRoute) return null;

    const handleAppDownload = (targetOs: "android" | "ios", defaultUrl: string) => {
        if (targetOs === "ios" && userOs === "android") {
            toast({
                title: "Android Device Detected 📱",
                description: "You are using an Android phone. Redirecting to Google Play Store for your device...",
            });
            setTimeout(() => {
                window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
            }, 800);
            return;
        }

        if (targetOs === "android" && userOs === "ios") {
            toast({
                title: "iOS Device Detected 🍎",
                description: "You are using an iPhone/iPad. Redirecting to Apple App Store for your device...",
            });
            setTimeout(() => {
                window.open(APP_STORE_URL, "_blank", "noopener,noreferrer");
            }, 800);
            return;
        }

        window.open(defaultUrl, "_blank", "noopener,noreferrer");
    };

    const renderCardContent = () => (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-[#7b4623]">
                        <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Get DevBhakti App</h4>
                        <p className="text-[10px] text-zinc-500 font-medium">Sacred darshan & pooja on the go</p>
                    </div>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="space-y-2.5 pt-1">
                {/* Android / Play Store Option */}
                <button
                    type="button"
                    onClick={() => handleAppDownload("android", PLAY_STORE_URL)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                        userOs === "android"
                            ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20 shadow-sm"
                            : "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:border-emerald-800"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-sm">
                            <Smartphone className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Android App</span>
                                {userOs === "android" && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Your Device
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Get it on Google Play</div>
                        </div>
                    </div>
                    <Download className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* iOS / App Store Option */}
                <button
                    type="button"
                    onClick={() => handleAppDownload("ios", APP_STORE_URL)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                        userOs === "ios"
                            ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/50 ring-2 ring-sky-500/20 shadow-sm"
                            : "border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 dark:bg-sky-950/30 dark:border-sky-800"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-900 text-white shrink-0 shadow-sm">
                            <Download className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">iOS App</span>
                                {userOs === "ios" && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-sky-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Your Device
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-sky-700 dark:text-sky-400 font-medium">Download on App Store</div>
                        </div>
                    </div>
                    <Download className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Floating Trigger Button */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 select-none">
                {isMobile ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label="Download DevBhakti App"
                        className={`flex items-center bg-gradient-to-l from-[#7b4623] via-[#94552c] to-[#7b4623] text-white py-2.5 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 transition-all duration-300 transform cursor-pointer ${
                            isExpanded ? "px-3.5" : "px-3"
                        }`}
                    >
                        <Smartphone className="w-5 h-5 text-amber-200 shrink-0" />
                        {isExpanded && (
                            <span className="whitespace-nowrap font-black text-xs tracking-wide ml-2 pr-1">
                                Download App
                            </span>
                        )}
                    </button>
                ) : (
                    <HoverCard
                        open={isExpanded}
                        onOpenChange={setIsExpanded}
                        openDelay={0}
                        closeDelay={200}
                    >
                        <HoverCardTrigger asChild>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                aria-label="Download DevBhakti App"
                                className={`flex items-center bg-gradient-to-l from-[#7b4623] via-[#94552c] to-[#7b4623] text-white py-2.5 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 transition-all duration-300 transform cursor-pointer group ${
                                    isExpanded ? "px-3.5" : "px-3 hover:px-3.5"
                                }`}
                            >
                                <Smartphone className="w-5 h-5 text-amber-200 shrink-0" />
                                <div
                                    className={`overflow-hidden transition-all duration-300 flex items-center ${
                                        isExpanded
                                            ? "max-w-xs opacity-100 ml-2"
                                            : "max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2"
                                    }`}
                                >
                                    <span className="whitespace-nowrap font-black text-xs tracking-wide pr-1">
                                        Download App
                                    </span>
                                </div>
                            </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                            side="left"
                            align="center"
                            className="w-80 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200/50 shadow-2xl mr-2"
                        >
                            {renderCardContent()}
                        </HoverCardContent>
                    </HoverCard>
                )}
            </div>

            {/* Mobile Modal Dialog */}
            {isMobile && isExpanded && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className="w-full max-w-xs p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-amber-200/50 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderCardContent()}
                    </div>
                </div>
            )}
        </>
    );
}

