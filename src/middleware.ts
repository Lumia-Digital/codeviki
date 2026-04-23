import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Try getting token, explicitly forcing secure cookie check in production
  // This fixes the Netlify Edge bug where req.nextUrl.protocol is seen as 'http:'
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development',
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
