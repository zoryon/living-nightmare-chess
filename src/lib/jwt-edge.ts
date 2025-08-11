import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
const EMAIL_SECRET = new TextEncoder().encode(process.env.JWT_EMAIL_SECRET!);

if (!ACCESS_SECRET || !REFRESH_SECRET || !EMAIL_SECRET) {
    throw new Error("Missing JWT secrets in env");
}

export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, ACCESS_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function verifyRefreshToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, REFRESH_SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function verifyEmailToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, EMAIL_SECRET);
        return payload;
    } catch {
        return null;
    }
}