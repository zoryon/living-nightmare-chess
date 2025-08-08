import { cookies } from "next/headers";

import { clearRefreshTokenCookie } from "@/lib/jwt";

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get("refreshToken")?.value;
    if (token) {
        await clearRefreshTokenCookie(token);
    }
    return new Response(null, { status: 204 });
}
