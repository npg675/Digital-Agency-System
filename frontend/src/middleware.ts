import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Exclude our main application domains
  const isMainDomain = 
    hostname.includes('localhost') || 
    hostname.includes('127.0.0.1') ||
    hostname.includes('landingforge.com') ||
    hostname.includes('vercel.app');

  // Skip middleware for API, static files, and internal next paths
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // If it's a custom domain, rewrite the request to our dynamic route
  if (!isMainDomain) {
    // Rewrite to our dynamic route: /domain/[hostname]
    response = NextResponse.rewrite(new URL(`/domain/${hostname}${url.pathname}`, request.url));
  }

  // Ensure every visitor gets a unique ID for A/B testing
  if (!request.cookies.has('visitor_id')) {
    response.cookies.set('visitor_id', crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}
