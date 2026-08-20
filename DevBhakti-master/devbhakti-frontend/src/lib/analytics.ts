/**
 * DevBhakti Google Analytics 4 (GA4) & Google Tag Manager (GTM) Utility
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: Record<string, any>[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Generic event tracker for GA4 / GTM
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window === "undefined") return;

  // 1. Push to window.dataLayer (for GTM)
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.dataLayer.push({
    event: eventName,
    ...eventParams,
    timestamp: new Date().toISOString(),
  });

  // 2. Send via window.gtag if GA4 is initialized
  if (typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("event", eventName, eventParams);
  }
};

/**
 * Specific E-Commerce / Business Analytics Trackers
 */

// Pooja Booking Event
export const trackPoojaPurchase = (data: {
  transactionId: string;
  poojaId?: string;
  poojaName?: string;
  value: number;
  currency?: string;
  templeName?: string;
}) => {
  trackEvent("purchase_pooja", {
    transaction_id: data.transactionId,
    item_id: data.poojaId,
    item_name: data.poojaName || "Pooja Booking",
    value: data.value,
    currency: data.currency || "INR",
    temple_name: data.templeName,
  });
};

// Donation Event
export const trackDonation = (data: {
  transactionId: string;
  campaignId?: string;
  campaignTitle?: string;
  value: number;
  currency?: string;
}) => {
  trackEvent("donate", {
    transaction_id: data.transactionId,
    campaign_id: data.campaignId,
    campaign_name: data.campaignTitle || "General Donation",
    value: data.value,
    currency: data.currency || "INR",
  });
};

// User Sign Up Event
export const trackSignUp = (method: string = "email") => {
  trackEvent("sign_up", { method });
};

// User Login Event
export const trackLogin = (method: string = "email") => {
  trackEvent("login", { method });
};

// View Temple / Mandal Page Event
export const trackViewTemple = (data: { templeId: string; templeName: string; location?: string }) => {
  trackEvent("view_temple", {
    temple_id: data.templeId,
    temple_name: data.templeName,
    location: data.location,
  });
};

// Live Darshan View Event
export const trackViewLiveDarshan = (data: { streamId?: string; templeName: string }) => {
  trackEvent("view_live_darshan", {
    stream_id: data.streamId,
    temple_name: data.templeName,
  });
};

// Search Event
export const trackSearch = (searchTerm: string) => {
  if (!searchTerm || searchTerm.trim().length === 0) return;
  trackEvent("search", { search_term: searchTerm.trim() });
};
