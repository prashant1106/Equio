import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = 
    request.cookies.get('better-auth.session_token')?.value || 
    request.cookies.get('__Secure-better-auth.session_token')?.value;
  
  const { pathname } = request.nextUrl;

  // If user is authenticated and visits the root, rewrite to the dashboard
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.rewrite(new URL('/dashboard', request.url));
    }
  }

  // If user is authenticated and tries to visit login/signup, redirect them to the newly defaulted dashboard at /
  if (['/login', '/signup'].includes(pathname)) {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup'],
};
