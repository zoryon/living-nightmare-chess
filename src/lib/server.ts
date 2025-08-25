"use server";

import { cookies } from "next/headers";

import { verifyAccessToken } from "@/lib/jwt-edge";

export async function getUserId(): Promise<number | null> {
    const accessToken = (await cookies()).get("access_token")?.value || "";
    const payload = await verifyAccessToken(accessToken);
    const uid = payload && typeof payload.userId === "number" ? payload.userId : null;
    return uid;
}