"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, Download, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AppQRCode } from "@/components/common/AppQRCode";
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

    const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.devbhakti.user&hl=en_IN";
    const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248156";

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
        <div className="space-y-3.5 text-center">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2 text-left">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-[#7b4623]">
                        <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Get DevBhakti App</h4>
                        <p className="text-[10px] text-zinc-500 font-medium">Sacred darshan & pooja on the go</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Center Logo QR Code */}
            <div className="py-2 flex flex-col items-center justify-center">
                <AppQRCode size={220} showLabels={false} logoUrl="/logo.png" />
                <div className="mt-3 space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Scan QR Code to Download App
                    </p>
                  
                </div>
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
                        className="flex flex-col items-center justify-center gap-2.5 bg-gradient-to-b from-[#7b4623] via-[#94552c] to-[#7b4623] text-white py-4 px-2.5 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 transition-all duration-300 transform cursor-pointer active:scale-95"
                    >
                        <Smartphone className="w-5 h-5 text-amber-200 shrink-0" />
                        <span className="writing-mode-vertical rotate-180 whitespace-nowrap font-black text-xs tracking-wider uppercase">
                            Download App
                        </span>
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
                                className="flex flex-col items-center justify-center gap-2.5 bg-gradient-to-b from-[#7b4623] via-[#94552c] to-[#7b4623] text-white py-4 px-2.5 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 transition-all duration-300 transform cursor-pointer group hover:scale-[1.03] hover:shadow-amber-900/40 hover:brightness-110"
                            >
                                <Smartphone className="w-5 h-5 text-amber-200 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="writing-mode-vertical rotate-180 whitespace-nowrap font-black text-xs tracking-wider uppercase">
                                    Download App
                                </span>
                            </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                            side="left"
                            align="center"
                            className="w-80 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-amber-200/50 shadow-2xl mr-2"
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

