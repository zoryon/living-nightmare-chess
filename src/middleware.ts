import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAccessToken, verifyRefreshToken } from "@/lib/jwt-edge";

// Paths accessible only by NOT logged-in users (public pages)
const PUBLIC_ONLY_PATHS = [
    "/login", 
    "/register", 
    "/register/confirm",
    "/api/auth/login", 
    "/api/auth/register",
    "/api/auth/register/confirm"
];

// Paths accessible by everyone (optional, e.g. static)
const OPEN_PATHS = [
    "/favicon.ico", 
    "/robots.txt", 
    "/api/health"
];

// Middleware
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow open paths
    if (OPEN_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const accessToken = req.cookies.get("access_token")?.value || "";
    const refreshToken = req.cookies.get("refresh_token")?.value || "";

    const isLoggedIn: boolean = !!(accessToken && await verifyAccessToken(accessToken));
    const hasRefreshToken: boolean = !!(refreshToken && await verifyRefreshToken(refreshToken));

    // Case 1: Logged in -> block login/register
    if ((isLoggedIn || hasRefreshToken) && PUBLIC_ONLY_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Case 2: Not logged in and no refresh token → block protected routes
    if (!isLoggedIn && !hasRefreshToken && !PUBLIC_ONLY_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Default: allow request, but mark token as stale
    return resWithTokenStatusHeader(isLoggedIn, hasRefreshToken);
}

function resWithTokenStatusHeader(isLoggedIn: boolean, hasRefreshToken: boolean) {
    const res = NextResponse.next();
    if (!isLoggedIn && hasRefreshToken) {
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
