import { cookies } from "next/headers";

import { clearRefreshTokenCookie } from "@/lib/jwt";

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    if (token) {
        await clearRefreshTokenCookie(token);
    }
    // Also clear access token cookie
    cookieStore.set("access_token", "", { expires: new Date(0), path: "/" });
    return new Response(null, { status: 204 });
}
