"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Smartphone } from "lucide-react";

interface AppQRCodeProps {
  size?: number;
  showLabels?: boolean;
  className?: string;
  logoUrl?: string;
}

export function AppQRCode({
  size = 260,
  showLabels = true,
  className = "",
  logoUrl = "/logo.png"
}: AppQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentOrigin = window.location.origin;
    const smartUrl = `${currentOrigin}/download`;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    // 1. Render QR Code onto Canvas with Error Correction Level 'H'
    QRCode.toCanvas(
      canvas,
      smartUrl,
      {
        width: size,
        margin: 1, // Compact margin
        errorCorrectionLevel: "H", // High error correction level for center logo
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      },
      (err) => {
        if (err) {
          console.error("QR Code Generation Error:", err);
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 2. Draw Center Logo Overlay (28% of size)
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = logoUrl;

        logo.onload = () => {
          const logoSize = Math.floor(size * 0.28);
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          const padding = 6;
          const bgX = x - padding / 2;
          const bgY = y - padding / 2;
          const bgSize = logoSize + padding;

          // White background pad for logo
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
          ctx.shadowBlur = 4;
          ctx.fillRect(bgX, bgY, bgSize, bgSize);
          ctx.restore();

          // Border line around logo pad
          ctx.strokeStyle = "#e5e7eb";
          ctx.lineWidth = 1;
          ctx.strokeRect(bgX, bgY, bgSize, bgSize);

          // Draw the DevBhakti Logo
          ctx.drawImage(logo, x, y, logoSize, logoSize);

          // Export final composite to Data URL
          setQrDataUrl(canvas.toDataURL("image/png"));
        };

        logo.onerror = () => {
          setQrDataUrl(canvas.toDataURL("image/png"));
        };
      }
    );
  }, [size, logoUrl]);

  const handleDirectClick = () => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const url = /iphone|ipad|ipod/i.test(ua)
        ? "https://apps.apple.com/in/app/devbhakti/id6761248"
        : "https://play.google.com/store/search?q=devbhakti&c=apps&hl=en_IN";
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Hidden working canvas for composite drawing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div
        onClick={handleDirectClick}
        className="relative p-1.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-amber-300/60 dark:border-amber-900/50 group transition-all hover:scale-[1.02] cursor-pointer"
        title="Click to open App Store / Play Store"
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Scan QR Code to Download DevBhakti App"
            className="rounded-xl object-contain"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-amber-50 dark:bg-zinc-800 rounded-xl"
            style={{ width: size, height: size }}
          >
            <Smartphone className="w-8 h-8 text-amber-700 animate-pulse" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] rounded-2xl">
          <span className="text-white text-xs font-bold px-3 py-1 bg-[#5d2e0b] rounded-full shadow-lg flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-amber-300" /> Open App Store
          </span>
        </div>
      </div>

      {showLabels && (
        <div className="mt-2 space-y-0.5">
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Scan QR Code</p>
          <p className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold">
            Android &amp; iPhone
          </p>
        </div>
      )}
    </div>
  );
}
