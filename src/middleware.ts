import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Extract subdomain
  const subdomain = hostname.split('.')[0];

  // Handle localhost development - ALL localhost traffic should stay local
  if (hostname.includes('localhost') || process.env.NODE_ENV === 'development') {
    // For diners.localhost or explore.localhost
    if (subdomain === 'diners' || subdomain === 'explore') {
      // Only rewrite the root path
      if (pathname === '/') {
        return NextResponse.rewrite(new URL('/diners', request.url));
      }
      // All other paths pass through unchanged
      return NextResponse.next();
    }

    // For restaurants.localhost
    if (subdomain === 'restaurants') {
      // Only rewrite the root path
      if (pathname === '/') {
        return NextResponse.rewrite(new URL('/restaurants', request.url));
      }
      // All other paths pass through unchanged
      return NextResponse.next();
    }

    // For plain localhost:3000, pass through everything
    return NextResponse.next();
  }

  // Production routing (mirch.app)
  if (subdomain === 'diners' || subdomain === 'explore') {
    // Only rewrite the root path
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/diners', request.url));
    }
    // All other paths pass through unchanged
    return NextResponse.next();
  }

  if (subdomain === 'restaurants') {
    // Only rewrite the root path
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/restaurants', request.url));
    }
    // All other paths pass through unchanged
    return NextResponse.next();
  }

  // Main domain (mirch.app) - redirect to landing page
  return NextResponse.redirect(new URL('https://mirch.app' + pathname));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - onboarding (onboarding route - should work on all subdomains)
     * - login, signup, auth (auth routes - should work on all subdomains)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|onboarding|login|signup|auth).*)',
  ],
};
