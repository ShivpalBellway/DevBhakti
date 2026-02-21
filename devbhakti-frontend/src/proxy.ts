import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    console.log(`[PROXY] Requesting: ${request.nextUrl.pathname}`);
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // List of hostnames that are NOT subdomains (base domains)
    // We remove the port for checking
    const baseHostname = hostname.split(':')[0];

    const mainDomains = [
        'localhost',
        '127.0.0.1',
        'devbhakti.local',
        'devbhakti.in',
        'lvh.me'
    ];

    // Check if hostname is an IP address (IPv4 or IPv6)
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(baseHostname) ||
        /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(baseHostname);

    const isMainDomain = mainDomains.includes(baseHostname) ||
        baseHostname === 'www.devbhakti.in' ||
        isIpAddress;

    console.log(`[PROXY] baseHostname: ${baseHostname}, isMainDomain: ${isMainDomain}`);

    if (!isMainDomain) {
        const parts = baseHostname.split('.');

        if (parts.length >= 2) {
            const subdomain = parts[0];

            if (subdomain && subdomain !== 'www') {
                // Case 1: Root path (e.g., kashi.devbhakti.in/) - Show Temple Profile
                if (url.pathname === '/') {
                    return NextResponse.rewrite(new URL(`/temples/subdomain/${subdomain}`, request.url));
                }

                // Case 2: Any other path (e.g., kashi.devbhakti.in/marketplace) 
                // Redirect to Main Domain
                const redirectUrl = new URL(url.pathname + url.search, request.url);

                // Determine main host without port if in production
                if (baseHostname.endsWith('devbhakti.in')) {
                    redirectUrl.host = 'devbhakti.in';
                    redirectUrl.port = ''; // Clear port for production
                } else {
                    // Local development fallback (lvh.me, etc)
                    const hostParts = hostname.split('.');
                    const mainHost = hostParts.slice(1).join('.');
                    redirectUrl.host = mainHost;
                }

                return NextResponse.redirect(redirectUrl);
            }
        }
    }

    return NextResponse.next();
}

// Config to match all routes except api, static files, and icons
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
