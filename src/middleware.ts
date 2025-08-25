import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAccessToken } from "@/lib/jwt-edge";

// Paths accessible only by NOT logged-in users (public pages)
const PUBLIC_ONLY_PATHS = [
    "/login", 
    "/register", 
    "/register/confirm",
    "/api/sessions",
    "/api/auth/register",
    "/api/auth/register/confirm",
];

// Paths accessible by everyone (optional, e.g. static)
const OPEN_PATHS = [
    "/favicon.ico", 
    "/robots.txt", 
    "/landing",
    "/pieces",
    "/api/health",
    "/api/sessions/current",
];

// Middleware
export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const method = req.method || "GET";

    // Allow open paths
    if (OPEN_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const accessToken = req.cookies.get("access_token")?.value || "";

    const accessPayload: any = accessToken ? await verifyAccessToken(accessToken) : null;
    const isLoggedIn: boolean = !!accessPayload;

    // Case 1: Logged in -> block login/register
    if (isLoggedIn && PUBLIC_ONLY_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Case 2: Not logged in → try a server-side refresh via redirect so the
    // path-scoped refresh cookie can be sent. Only for GET to avoid method issues.
    if (!isLoggedIn && !PUBLIC_ONLY_PATHS.some(path => pathname.startsWith(path))) {
        // Allow direct access to the refresh path family (cookie will be present there)
        if (pathname.startsWith("/api/auth/refresh")) {
            return NextResponse.next();
        }
        if (method === "GET") {
            const next = encodeURIComponent(`${pathname}${search || ""}`);
            return NextResponse.redirect(new URL(`/api/auth/refresh/redirect?next=${next}`, req.url));
        }
        // For non-GET, fall back to landing
        return NextResponse.redirect(new URL("/landing", req.url));
    }

    // Default: allow request, but mark token as stale
    // If the access token is close to expiring (<=30s), mark as stale to trigger client-side refresh.
    let expiringSoon = false;
    if (accessPayload && typeof accessPayload.exp === "number") {
        const now = Math.floor(Date.now() / 1000);
        expiringSoon = accessPayload.exp - now <= 30; // 30s threshold
    }
    return resWithTokenStatusHeader(expiringSoon);
}

function resWithTokenStatusHeader(expiringSoon = false) {
    const res = NextResponse.next();
    if (expiringSoon) {
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
