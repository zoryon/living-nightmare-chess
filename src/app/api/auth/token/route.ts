import { cookies } from "next/headers";

export async function GET() {
    const token = (await cookies()).get("access_token");
    if (!token) {
        return new Response("Not found", { status: 404 });
    }
    return new Response(JSON.stringify({ token }), { status: 200 });
}