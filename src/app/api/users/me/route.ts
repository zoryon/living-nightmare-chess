import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";
import { PublicUser } from "@/types";

export async function GET(): Promise<Response> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value || "";

    // Verify token
    const payload = await verifyAccessToken(accessToken);
    if (!payload || typeof payload.userId !== "number") {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 400 });
    }

    // Cross check with DB
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });

    if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const { passwordHash, ...publicUser } = user as typeof user & { passwordHash?: string } & { publicUser: PublicUser };

    return new Response(JSON.stringify({ publicUser }), { status: 200 });
}
