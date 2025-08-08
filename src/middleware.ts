import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyEdgeAccessToken } from "@/lib/jwt-edge";

// Paths accessible only by NOT logged-in users (public pages)
const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

// Paths accessible by everyone (optional, e.g. static)
const OPEN_PATHS = ["/favicon.ico", "/robots.txt", "/api/health"];

// Middleware function
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow open paths without checks
    if (OPEN_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const accessToken = req.cookies.get("access_token")?.value || "";
    const hasRefresh = Boolean(req.cookies.get("refresh_token")?.value);

    const user = accessToken ? await verifyEdgeAccessToken(accessToken) : null;
    const isLoggedIn = Boolean(user);

    // If logged in, block public-only paths (login, register)
    if (isLoggedIn && PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/", req.url)); 
    }

    // If NOT logged in, block everything except public paths
    if (!isLoggedIn) {
        if (!PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
            // If we have a refresh token allow request to continue so client can silently refresh
            if (!hasRefresh) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }
    }
    // Allow the request; add a hint header if access token missing but refresh present
    const res = NextResponse.next();
    if (!isLoggedIn && hasRefresh) {
        res.headers.set("x-token-status", "stale");
    }
    return res;
}

// Apply middleware only to pages and api routes you want to protect
export const config = {
    matcher: [
        /*
         * Match all routes except _next/static, _next/image, favicon.ico, etc.
         * Customize as needed
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
