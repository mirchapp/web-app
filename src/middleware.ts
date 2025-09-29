import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Skip middleware for localhost development (unless using subdomains)
  if (hostname === 'localhost:3000') {
    return NextResponse.next();
  }
  
  // Route based on subdomain
  switch (subdomain) {
    case 'diners':
    case 'explore':
      // Both diners and explore point to the same app
      const dinersResponse = NextResponse.next();
      dinersResponse.headers.set('x-app-version', 'diners');
      return dinersResponse;
    
    case 'restaurants':
      // Restaurants app
      const restaurantsResponse = NextResponse.next();
      restaurantsResponse.headers.set('x-app-version', 'restaurants');
      return restaurantsResponse;
    
    default:
      // Main domain (mirch.app) - redirect to landing page
      return NextResponse.redirect(new URL('https://mirch.app' + request.nextUrl.pathname));
  }
}

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
