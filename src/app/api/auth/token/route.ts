import { cookies } from "next/headers";

export async function GET() {
    const token = (await cookies()).get("access_token");
    if (!token) {
        return new Response("Not found", { status: 404 });
    }
    // Return only the token value, not the full cookie object
    return new Response(JSON.stringify({ token: token.value }), {
        status: 200,
        headers: { "content-type": "application/json" }
    });
}