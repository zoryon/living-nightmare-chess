import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

if (!ACCESS_SECRET) {
    throw new Error("Missing JWT secrets in env");
}

export async function verifyEdgeAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, ACCESS_SECRET);
        return payload;
    } catch {
        return null;
    }
}
