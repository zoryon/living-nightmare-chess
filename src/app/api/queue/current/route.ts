import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const playersNum: number = await prisma.match_queue.count({
        where: {
            status: "WAITING",
        },
    });

    return NextResponse.json({ playersNum }, { status: 200 })
}