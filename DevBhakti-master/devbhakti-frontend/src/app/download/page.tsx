"use client";

import { useEffect, useState } from "react";
import { Smartphone, ExternalLink, Apple } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.devbhakti.app";
const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248";

export default function DownloadAppPage() {
  const [storeUrl, setStoreUrl] = useState<string>(APP_STORE_URL);
  const [isIosDevice, setIsIosDevice] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      (/Macintosh/i.test(ua) && "ontouchend" in document);

    setIsIosDevice(isIOS);

    if (!isIOS) {
      // Android: Intent URL — Opens App if installed, else opens Play Store directly
      const androidIntentUrl =
        "intent://open#Intent;scheme=devbhakti;package=com.devbhakti.app;S.browser_fallback_url=" +
        encodeURIComponent(PLAY_STORE_URL) +
        ";end";

      setStoreUrl(PLAY_STORE_URL);
      try {
        window.location.href = androidIntentUrl;
      } catch (e) {
        window.location.href = PLAY_STORE_URL;
      }
    } else {
      // iOS: Try launching devbhakti:// app scheme first, fallback to App Store if not installed
      setStoreUrl(APP_STORE_URL);
      const appSchemeUrl = "devbhakti://open";
      const start = Date.now();

      window.location.href = appSchemeUrl;

      // If app is not installed (browser stays open), fallback to App Store after delay
      const timer = setTimeout(() => {
        if (Date.now() - start < 2500) {
          window.location.href = APP_STORE_URL;
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf8f0] via-[#f5e6d3] to-[#fdf8f0] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-amber-200/60 space-y-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#7b4623] to-[#94552c] rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg animate-bounce">
          <Smartphone className="w-8 h-8 text-amber-200" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-[#7b4623]">Opening DevBhakti...</h2>
          <p className="text-xs text-slate-600 font-medium">
            Launching installed app or opening the official {isIosDevice ? "Apple App Store" : "Google Play Store"}.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <a
            href={storeUrl}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7b4623] via-[#88542b] to-[#3d1a10] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer"
          >
            {isIosDevice ? <Apple className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            Open DevBhakti App / {isIosDevice ? "App Store" : "Play Store"}
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>

          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-2">
            <a href={APP_STORE_URL} className="text-amber-800 underline hover:text-amber-900">
              iPhone / iOS App
            </a>
            <span>•</span>
            <a href={PLAY_STORE_URL} className="text-amber-800 underline hover:text-amber-900">
              Android App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
