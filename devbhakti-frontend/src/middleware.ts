import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
    
    const isMainDomain = mainDomains.includes(baseHostname) || baseHostname === 'www.devbhakti.in';

    if (!isMainDomain) {
        const parts = baseHostname.split('.');
        
        if (parts.length >= 2) {
            const subdomain = parts[0];
            
            if (subdomain && subdomain !== 'www') {
                // Case 1: Root path (e.g., kashi.lvh.me/) - Show Temple Profile
                if (url.pathname === '/') {
                    return NextResponse.rewrite(new URL(`/temples/subdomain/${subdomain}`, request.url));
                }
                
                // Case 2: Any other path (e.g., kashi.lvh.me/booking) 
                // Redirect to Main Domain to maintain shared Auth/LocalStorage/Cart
                const hostParts = hostname.split('.');
                const mainHost = hostParts.slice(1).join('.'); // extracts 'lvh.me:3000' or 'devbhakti.in'
                
                const redirectUrl = new URL(url.pathname + url.search, request.url);
                redirectUrl.host = mainHost;
                
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
