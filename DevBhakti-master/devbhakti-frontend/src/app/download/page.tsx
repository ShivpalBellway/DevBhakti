"use client";

import { useEffect } from "react";

const PLAY_STORE_URL = "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248";

export default function DownloadAppPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/iphone|ipad|ipod/i.test(ua)) {
        window.location.replace(APP_STORE_URL);
      } else {
        window.location.replace(PLAY_STORE_URL);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <div className="w-12 h-12 border-4 border-[#7c4624] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-[#7c4624]">Redirecting to Official Store...</h2>
        <p className="text-xs text-slate-500 font-medium">Please wait while we open Play Store / App Store on your device.</p>
      </div>
    </div>
  );
}
