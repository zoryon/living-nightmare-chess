import { serialize } from "cookie";

const domain = process.env.COOKIE_DOMAIN || "localhost";
const secure = process.env.COOKIE_SECURE === "true" || process.env.COOKIE_SECURE === "1";

export function serializeRefreshTokenCookie(token: string, days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30)) {
    return serialize("lnm_refresh_token", token, {
        httpOnly: true,
        secure: secure,
        sameSite: "lax",
        path: "/",
        maxAge: days * 24 * 60 * 60,
        domain: domain
    });
}

export function clearRefreshTokenCookie() {
    return serialize("lnm_refresh_token", "", {
        httpOnly: true,
        secure: secure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        domain: domain
    });
}
