import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with /admin
  if (pathname.startsWith('/admin')) {
    // Check the environment variable
    const isAdminPanelEnabled = process.env.ADMIN_PANEL_ENABLED === 'true';

    // If admin panel is disabled, redirect to home page or show 404
    if (!isAdminPanelEnabled) {
      // You can either redirect to home:
      return NextResponse.redirect(new URL('/', request.url));
      
      // Or you can rewrite to a 404 page (if you have one)
      // return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
};
