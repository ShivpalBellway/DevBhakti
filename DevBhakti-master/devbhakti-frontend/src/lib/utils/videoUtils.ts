export type VideoRenderKind = "iframe" | "video" | "html" | "unknown";

export interface VideoRenderInfo {
  kind: VideoRenderKind;
  src: string;
  platform: string | null;
}

const normalizeUrl = (value: string) => value.trim();

const normalizeUrlWithProtocol = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const normalizeBracketedLink = (value: string) => {
  let text = value.trim();
  const markdownLink = text.match(/\[(?:[^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
  if (markdownLink?.[1]) {
    return markdownLink[1];
  }
  text = text.replace(/src=\s*"\[?(https?:\/\/[^\]"\s]+)\]?"/gi, 'src="$1"');
  const bracketOnly = text.match(/^\[?(https?:\/\/[^\]\s]+)\]?$/i);
  if (bracketOnly?.[1]) {
    return bracketOnly[1];
  }
  return text;
};

/**
 * Convert Livebox player URL to direct HLS `.m3u8` stream URL when possible.
 * Example:
 *  https://account20.livebox.co.in/livebox/player/?chnl=Divinityone
 * -> https://account20.livebox.co.in/Divinityonehls/Live.m3u8
 */
export const convertLiveboxToHls = (_value?: string | null): string | null => {
  // Livebox player URLs (e.g. https://account10.livebox.co.in/livebox/player/?chnl=...) must be loaded via iframe.
  return null;
};

const isRawEmbedHtml = (value: string) => {
  const trimmed = value.trim();
  return /<iframe[\s\S]*<\/iframe>/i.test(trimmed) || /<video[\s\S]*<\/video>/i.test(trimmed) || /<embed[\s\S]*>/i.test(trimmed);
};

export const extractYouTubeId = (value?: string | null): string | null => {
  if (!value) return null;
  const s = value.trim();
  const normalized = s.replace(/^https?:\/\//i, "");

  const watchMatch = normalized.match(/[?&]v=([\w-]{11})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const shortMatch = normalized.match(/youtu\.be\/([\w-]{11})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const embedMatch = normalized.match(/embed\/([\w-]{11})/);
  if (embedMatch?.[1]) return embedMatch[1];

  const shortsMatch = normalized.match(/shorts\/([\w-]{11})/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  const liveMatch = normalized.match(/\/live\/([\w-]{11})/);
  if (liveMatch?.[1]) return liveMatch[1];

  return null;
};

const getYouTubeEmbedUrl = (value: string) => {
  const videoId = extractYouTubeId(value);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const isIpHost = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  if (videoId) {
    // Include origin param on localhost/domain (YouTube needs it), skip on IP (YouTube rejects IPs)
    return isIpHost
      ? `https://www.youtube.com/embed/${videoId}`
      : `https://www.youtube.com/embed/${videoId}?origin=${encodeURIComponent(origin)}`;
  }

  const trimmed = value.trim();
  if (/^UC[\w-]{20,}$/i.test(trimmed)) {
    return isIpHost
      ? `https://www.youtube.com/embed/live_stream?channel=${trimmed}`
      : `https://www.youtube.com/embed/live_stream?channel=${trimmed}&origin=${encodeURIComponent(origin)}`;
  }

  let url = trimmed;
  if (url.includes("youtube.com/embed/")) url = url;
  else if (url.includes("youtu.be/")) url = url.replace("youtu.be/", "www.youtube.com/embed/");
  else if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");

  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (isIpHost) {
      urlObj.searchParams.delete("origin");
    } else if (!urlObj.searchParams.has("origin")) {
      urlObj.searchParams.set("origin", origin);
    }
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

const getVimeoEmbedUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrlWithProtocol(value));
    if (url.hostname.includes("vimeo.com")) {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)/);
      if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch (error) {
    // ignore
  }
  return value.trim();
};

const getTwitchEmbedUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrlWithProtocol(value));
    const pathParts = url.pathname.split("/").filter(Boolean);
    const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";

    if (pathParts[0] === "videos" && pathParts[1]) {
      return `https://player.twitch.tv/?video=${pathParts[1]}&parent=${parent}`;
    }
    if (pathParts[0] === "clips" && pathParts[1]) {
      return `https://clips.twitch.tv/embed?clip=${pathParts[1]}&parent=${parent}`;
    }
    if (pathParts[0] && pathParts[0] !== "embed") {
      return `https://player.twitch.tv/?channel=${pathParts[0]}&parent=${parent}`;
    }
  } catch (error) {
    // ignore
  }
  return value.trim();
};

const getFacebookEmbedUrl = (value: string) => {
  const encoded = encodeURIComponent(value.trim());
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=0`;
};

const getInstagramEmbedUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrlWithProtocol(value));
    const cleanPath = url.pathname.replace(/\/$/, "");
    return `https://www.instagram.com${cleanPath}/embed/`;
  } catch (error) {
    return value.trim();
  }
};

const getTwitterEmbedUrl = (value: string) => {
  return `https://twitframe.com/show?url=${encodeURIComponent(value.trim())}`;
};

const getDailymotionEmbedUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrlWithProtocol(value));
    const match = url.pathname.match(/\/video\/([\w-]+)/);
    if (match?.[1]) return `https://www.dailymotion.com/embed/video/${match[1]}`;
  } catch (error) {
    // ignore
  }
  return value.trim();
};

export const getVideoRenderInfo = (value?: string | null): VideoRenderInfo => {
  if (!value) return { kind: "unknown", src: "", platform: null };
  let trimmed = normalizeBracketedLink(value);

  // Extract URL from wrapper players (like hlsplayer.org?url=...)
  try {
    const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const queryUrl = urlObj.searchParams.get("url") || urlObj.searchParams.get("src") || urlObj.searchParams.get("file");
    if (queryUrl && (queryUrl.toLowerCase().includes(".m3u8") || queryUrl.toLowerCase().includes(".mp4"))) {
      trimmed = queryUrl;
    }
  } catch (e) {
    // ignore
  }

  // Prefer known direct HLS for Livebox embeds
  const liveboxHls = convertLiveboxToHls(trimmed);
  if (liveboxHls) {
    return { kind: "video", src: liveboxHls, platform: "livebox_hls" };
  }
  if (!trimmed) return { kind: "unknown", src: "", platform: null };

  if (isRawEmbedHtml(trimmed)) {
    // If it's a YouTube iframe embed code, extract the video ID and use
    // youtube-nocookie.com instead — this avoids YouTube blocking embeds
    // from raw IP addresses (Error 153 / "Video unavailable").
    const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (iframeSrcMatch?.[1]) {
      const iframeSrc = iframeSrcMatch[1];
      const isYouTubeIframe =
        iframeSrc.includes("youtube.com/embed") ||
        iframeSrc.includes("youtu.be");
      if (isYouTubeIframe) {
        const ytId = extractYouTubeId(iframeSrc);
        if (ytId) {
          return {
            kind: "iframe",
            src: `https://www.youtube.com/embed/${ytId}`,
            platform: "youtube",
          };
        }
      }
    }
    return { kind: "html", src: trimmed, platform: "embed_html" };
  }

  const lower = trimmed.toLowerCase();

  if (/\.(mp4|webm|mov|ogg|ogv)(\?.*)?$/.test(lower) || /^data:video\//.test(lower) || /^blob:/.test(lower)) {
    return { kind: "video", src: trimmed, platform: "direct" };
  }

  if (/\.m3u8(\?.*)?$/.test(lower)) {
    return { kind: "video", src: trimmed, platform: "hls" };
  }

  if (/^(uc[\w-]{20,})$/i.test(trimmed) || lower.includes("youtube.com") || lower.includes("youtu.be/")) {
    return { kind: "iframe", src: getYouTubeEmbedUrl(trimmed), platform: "youtube" };
  }

  if (lower.includes("vimeo.com")) {
    return { kind: "iframe", src: getVimeoEmbedUrl(trimmed), platform: "vimeo" };
  }

  if (lower.includes("twitch.tv")) {
    return { kind: "iframe", src: getTwitchEmbedUrl(trimmed), platform: "twitch" };
  }

  if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    return { kind: "iframe", src: getFacebookEmbedUrl(trimmed), platform: "facebook" };
  }

  if (lower.includes("instagram.com")) {
    return { kind: "iframe", src: getInstagramEmbedUrl(trimmed), platform: "instagram" };
  }

  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return { kind: "iframe", src: getTwitterEmbedUrl(trimmed), platform: "twitter" };
  }

  if (lower.includes("dailymotion.com")) {
    return { kind: "iframe", src: getDailymotionEmbedUrl(trimmed), platform: "dailymotion" };
  }

  if (lower.includes("livebox.co.in") || lower.includes("/livebox/player")) {
    return { kind: "iframe", src: trimmed, platform: "livebox" };
  }

  if (/^(https?:\/\/|\/\/)/.test(trimmed)) {
    return { kind: "iframe", src: trimmed, platform: "unknown" };
  }

  return { kind: "unknown", src: "", platform: null };
};
