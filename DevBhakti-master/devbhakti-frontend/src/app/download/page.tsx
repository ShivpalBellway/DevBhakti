"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, Download, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { AppQRCode } from "@/components/common/AppQRCode";
import Logo from "@/components/icons/Logo";

export default function DownloadAppPage() {
  const [deviceDetected, setDeviceDetected] = useState<"android" | "ios" | "desktop">("desktop");
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const PLAY_STORE_URL = "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
  const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/android/i.test(ua)) {
        setDeviceDetected("android");
        setIsRedirecting(true);
        window.location.href = PLAY_STORE_URL;
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        setDeviceDetected("ios");
        setIsRedirecting(true);
        window.location.href = APP_STORE_URL;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf8f4] via-[#faf0e6] to-[#f4e6d8] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header Logo */}
      <div className="container mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="md" variant="full" />
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-[#7c4624] hover:text-[#5d2e0b] dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          Go to Website <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Download Card Container */}
      <div className="container mx-auto max-w-4xl my-auto py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-amber-200/70 dark:border-amber-900/40 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side: App Details & Features */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-[#7c4624] dark:text-amber-300 text-xs font-bold border border-amber-300/50">
              <Sparkles className="w-3.5 h-3.5" /> Official DevBhakti Mobile App
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                हर दिन घर बैठे पाइए <span className="text-[#7c4624] dark:text-amber-500">दिव्य दर्शन</span> एवं पूजा सेवा
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                Experience daily live darshan from famous temples, book online poojas, order sacred e-prasad, and connect with your favourite mandals anywhere in the world.
              </p>
            </div>

            {/* Redirection Alert Banner if on mobile */}
            {isRedirecting && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300/60 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-3 animate-pulse">
                <Smartphone className="w-5 h-5 text-[#7c4624] shrink-0" />
                <span>
                  {deviceDetected === "android" ? "Android phone detected! Redirecting to Google Play Store..." : "iPhone/iPad detected! Redirecting to Apple App Store..."}
                </span>
              </div>
            )}

            {/* App Features List */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>24/7 HD Live Darshan from Premium Temples</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct Online Pooja & Seva Booking with Video Updates</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pure Home-Delivered E-Prasad & Sacred Items Store</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant E-Receipts & 100% Safe Payment Guarantee</span>
              </div>
            </div>

            {/* Manual Download Store Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.02] transition-transform shadow-lg group"
              >
                <Smartphone className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
                <div className="text-left">
                  <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">GET IT ON</div>
                  <div className="text-xs font-bold leading-tight">Google Play</div>
                </div>
              </a>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-[#7c4624] text-white hover:bg-[#5d2e0b] hover:scale-[1.02] transition-all shadow-lg group"
              >
                <Download className="w-5 h-5 text-amber-200" />
                <div className="text-left">
                  <div className="text-[10px] font-medium text-amber-200/80 uppercase tracking-wider">DOWNLOAD ON</div>
                  <div className="text-xs font-bold leading-tight">App Store</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right Side: Smart QR Code Showcase */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-amber-50/80 to-amber-100/40 dark:from-zinc-800/50 dark:to-zinc-800/20 p-6 sm:p-8 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 text-center">
            <AppQRCode size={200} showLabels={false} />
            <div className="mt-4 space-y-1">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Point Camera & Scan QR</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Open phone camera or QR reader to download automatically on Android or iPhone.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe & Official App Link
            </div>
          </div>

        </div>
      </div>

      {/* Footer Copyright */}
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 py-4">
        © {new Date().getFullYear()} DevBhakti. All rights reserved.
      </div>
    </div>
  );
}
