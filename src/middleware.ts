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

    const accessPayload: any = accessToken ? await verifyAccessToken(accessToken) : null;
    const isLoggedIn: boolean = !!accessPayload;
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
    // If the access token is close to expiring (<=30s), mark as stale to trigger client-side refresh.
    let expiringSoon = false;
    if (accessPayload && typeof accessPayload.exp === "number") {
        const now = Math.floor(Date.now() / 1000);
        expiringSoon = accessPayload.exp - now <= 30; // 30s threshold
    }
    return resWithTokenStatusHeader(isLoggedIn, hasRefreshToken, expiringSoon);
}

function resWithTokenStatusHeader(isLoggedIn: boolean, hasRefreshToken: boolean, expiringSoon = false) {
    const res = NextResponse.next();
    if ((!isLoggedIn && hasRefreshToken) || expiringSoon) {
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
