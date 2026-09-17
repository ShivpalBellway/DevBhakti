// src/app/qr/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from "@/config/apiConfig";

const INVALID_QR_IDS = new Set(["", "undefined", "null"]);

// App configuration
const APP_CONFIG = {
  scheme: 'devbhakti://',
  androidPackage: 'com.devbhakti.user',
  iosBundleId: 'com.devbhakti.user',
  deepLinkPath: 'temples',
};

export default function QrRedirectPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [templeData, setTempleData] = useState<any>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const id = params.id?.toString().trim();
    
    if (!id || INVALID_QR_IDS.has(id.toLowerCase())) {
      console.log('[QR] Invalid ID, redirecting to /');
      window.location.href = '/';
      return;
    }

    const fetchTempleAndRedirect = async () => {
      try {
        const fetchUrl = `${API_URL}/temples/${id}`;
        console.log(`[QR] Fetching: ${fetchUrl}`);
        
        const response = await fetch(fetchUrl, { cache: "no-store" });
        
        if (!response.ok) {
          console.log(`[QR] API Failed - Status: ${response.status}`);
          window.location.href = `/temples/${id}`;
          return;
        }
        
        const json = await response.json();
        const temple = json?.data;
        
        if (!temple) {
          console.log('[QR] No temple data found');
          window.location.href = `/temples/${id}`;
          return;
        }
        
        setTempleData(temple);
        setLoading(false);
        
        // Build web URL
        const webUrl = buildWebUrl(temple);
        
        // Try to open app
        attemptAppRedirect(webUrl, temple);
        
      } catch (error: any) {
        console.error('QR redirect failed', error);
        window.location.href = `/temples/${id}`;
      }
    };

    fetchTempleAndRedirect();
  }, [params.id]);

  const buildWebUrl = (temple: any): string => {
    if (temple.urlType === "subdomain" && temple.subdomain) {
      const host = window.location.host;
      const hostname = host.split(':')[0];
      const port = host.includes(':') ? `:${host.split(':')[1]}` : '';
      
      const isLocal = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname.endsWith('.lvh.me') || 
                      hostname.endsWith('.localhost');
      
      if (isLocal) {
        return `http://${temple.subdomain}.lvh.me${port}`;
      } else {
        let baseDomain = "devbhakti.in";
        if (hostname.endsWith("devbhakti.in")) {
          baseDomain = "devbhakti.in";
        } else if (hostname.endsWith("devbhakti.com")) {
          baseDomain = "devbhakti.com";
        } else {
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            baseDomain = parts.slice(-2).join('.');
          }
        }
        return `https://${temple.subdomain}.${baseDomain}${port}`;
      }
    } else {
      const slug = temple.slug || temple.id;
      return `${window.location.origin}/temples/${slug}`;
    }
  };

  const attemptAppRedirect = (webUrl: string, temple: any) => {
    if (redirectAttempted) return;
    setRedirectAttempted(true);

    const slug = temple.slug || temple.id;
    
    const appDeepLink = `${APP_CONFIG.scheme}${APP_CONFIG.deepLinkPath}/${slug}`;
    const androidIntent = `intent://${APP_CONFIG.deepLinkPath}/${slug}#Intent;package=${APP_CONFIG.androidPackage};scheme=devbhakti;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;

    // Desktop users → web directly
    if (!isMobile) {
      console.log('[QR] Desktop user, redirecting to web');
      window.location.replace(webUrl);
      return;
    }

    console.log(`[QR] Mobile user, attempting to open app: ${appDeepLink}`);
    
    // Try to open app immediately, then fallback to web after a short delay
    if (isIOS) {
      window.location.href = appDeepLink;
      setTimeout(() => {
        window.location.replace(webUrl);
      }, 500);
    } else if (isAndroid) {
      // Android intent with browser_fallback_url handles the fallback natively without needing a timeout
      window.location.replace(androidIntent);
    } else {
      window.location.replace(webUrl);
    }
  };

  // We no longer show a bulky interstitial. Just a subtle loader.
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-pulse">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}