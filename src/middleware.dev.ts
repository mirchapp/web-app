import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only run in development with localhost subdomains
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  
  // Handle localhost subdomains in dev
  if (hostname.includes('localhost')) {
    const subdomain = hostname.split('.')[0];
    
    switch (subdomain) {
      case 'diners':
      case 'explore':
        const dinersResponse = NextResponse.next();
        dinersResponse.headers.set('x-app-version', 'diners');
        return dinersResponse;
      
      case 'restaurants':
        const restaurantsResponse = NextResponse.next();
        restaurantsResponse.headers.set('x-app-version', 'restaurants');
        return restaurantsResponse;
      
      default:
        // Default localhost:3000 - no redirect in dev
        return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}
