"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";
import logo2 from "@/assets/logo2.png";

const PLAY_STORE_URL = "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6503041661";

export function FloatingDownloadApp() {
    const [downloadUrl, setDownloadUrl] = useState(PLAY_STORE_URL);
    const [platformName, setPlatformName] = useState("App");
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        const isAndroid = /Android/i.test(ua);

        if (isIOS) {
            setDownloadUrl(APP_STORE_URL);
            setPlatformName("iOS App");
        } else if (isAndroid) {
            setDownloadUrl(PLAY_STORE_URL);
            setPlatformName("Android App");
        } else {
            setDownloadUrl(PLAY_STORE_URL);
            setPlatformName("App");
        }
    }, []);

    const handleClick = () => {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 group flex items-center select-none">
            <button
                onClick={handleClick}
                aria-label="Download DevBhakti App"
                className="flex items-center gap-2 bg-gradient-to-l from-[#7b4623] via-[#94552c] to-[#7b4623] text-white pl-3 pr-2.5 py-3 rounded-l-2xl shadow-2xl border-l border-y border-amber-300/30 hover:pr-4 transition-all duration-300 transform group-hover:-translate-x-1"
            >
                {/* Logo / Badge */}
                <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 animate-pulse group-hover:animate-none">
                    <img
                        src={logo2.src || logo2}
                        alt="DevBhakti Logo"
                        className="w-full h-full object-contain rounded-full"
                    />
                </div>

                {/* Vertical / Hover Text */}
                <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
                        Get DevBhakti
                    </span>
                    <span className="text-xs font-black tracking-wide flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-amber-200" />
                        <span>Download {platformName}</span>
                    </span>
                </div>
            </button>
        </div>
    );
}
