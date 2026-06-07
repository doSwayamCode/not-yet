import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Safely initialize clerk middleware handler
let clerkMiddlewareHandler: any = null;
if (isClerkEnabled) {
  try {
    clerkMiddlewareHandler = clerkMiddleware();
  } catch (e) {
    console.warn('Clerk Middleware could not be initialized (likely missing keys):', e);
  }
}

export default async function middleware(request: NextRequest, event: any) {
  // In Next.js middleware, we can create security header layers:
  const response = NextResponse.next();
  const headers = response.headers;

  // OWASP Top 10 Security Headers
  headers.set('X-Frame-Options', 'DENY'); // Clickjacking protection
  headers.set('X-Content-Type-Options', 'nosniff'); // MIME sniffing protection
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' https: data:; connect-src 'self' https:; media-src 'self' data: https:;"
  );

  // If Clerk is enabled, run Clerk middleware
  if (isClerkEnabled && clerkMiddlewareHandler) {
    try {
      return await clerkMiddlewareHandler(request, event);
    } catch (e) {
      // Fallback in case Clerk crashes
      console.error('Clerk Middleware execution error:', e);
    }
  }

  // Mock Admin Guard (if Clerk is disabled)
  if (!isClerkEnabled && request.nextUrl.pathname.startsWith('/admin')) {
    const mockUserId = request.cookies.get('mock_user_id')?.value;
    if (mockUserId !== 'mock_admin_1') {
      // Redirect to landing page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static files, Next.js internals, and public images
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    '/(api|trpc)(.*)',
  ],
};
