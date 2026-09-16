import { Router, Request, Response } from "express";

const router = Router();

const ANDROID_PACKAGE = "com.devbhakti.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = "https://apps.apple.com/app/devbhakti/REPLACE_WITH_IOS_APP_ID";
const WEB_BASE_URL = process.env.FRONTEND_URL || "https://devbhakti.com";

// ─── Utility: Detect platform from User-Agent ─────────────────────────────────
function detectPlatform(ua: string): "android" | "ios" | "web" {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

// ─── Smart Deep Link: /app/campaigns/:slug?entry=ENTRY_ID ────────────────────
//  Mobile Developer Usage:
//    Android intent:  intent://campaigns/maza-ganesha?entry=xyz#Intent;scheme=https;host=api.devbhakti.com;end
//    iOS Universal:   https://api.devbhakti.com/campaigns/maza-ganesha?entry=xyz
//
router.get("/campaigns/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;
  const entryId = req.query.entry || req.query.entryId;
  const ua = req.headers["user-agent"] || "";
  const platform = detectPlatform(ua);

  const webUrl = entryId
    ? `${WEB_BASE_URL}/campaigns/${slug}?entry=${entryId}`
    : `${WEB_BASE_URL}/campaigns/${slug}`;

  if (platform === "android") {
    // Android Intent URL — if app is installed, opens it; else falls back to Play Store
    const intentUrl =
      `intent://campaigns/${slug}${entryId ? `?entry=${entryId}` : ""}` +
      `#Intent;scheme=devbhakti;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

    return res.redirect(302, intentUrl);
  }

  if (platform === "ios") {
    // iOS — Universal Links handle this automatically if app is installed.
    // This route serves as fallback (when AASA is not matching), redirect to web.
    return res.redirect(302, webUrl);
  }

  // Desktop / Unknown → redirect to web
  return res.redirect(302, webUrl);
});

// ─── Smart Deep Link: /app/mandals/:id ───────────────────────────────────────
router.get("/mandals/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const ua = req.headers["user-agent"] || "";
  const platform = detectPlatform(ua);
  const webUrl = `${WEB_BASE_URL}/mandals/${id}`;

  if (platform === "android") {
    const intentUrl =
      `intent://mandals/${id}` +
      `#Intent;scheme=devbhakti;package=${ANDROID_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    return res.redirect(302, intentUrl);
  }

  return res.redirect(302, webUrl);
});

// ─── Generic App Store Redirect ───────────────────────────────────────────────
router.get("/download", (req: Request, res: Response) => {
  const ua = req.headers["user-agent"] || "";
  const platform = detectPlatform(ua);

  if (platform === "ios") return res.redirect(302, APP_STORE_URL);
  return res.redirect(302, PLAY_STORE_URL);
});

export default router;
