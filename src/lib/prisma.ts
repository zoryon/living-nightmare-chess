import { PrismaClient } from "@/generated/prisma";

function cleanEnvString(val?: string): string | undefined {
    if (val == null) return undefined;
    const t = val.trim();
    if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1);
    }
    return t;
}

// Prisma reads DATABASE_URL from process.env; ensure it's not quoted when injected by docker --env-file
if (process.env.DATABASE_URL) {
    const cleaned = cleanEnvString(process.env.DATABASE_URL);
    if (cleaned && cleaned !== process.env.DATABASE_URL) {
        process.env.DATABASE_URL = cleaned;
    }
}

declare global {
    // allow global `prisma` in dev to avoid hot-reload problems
    // @ts-ignore
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });

if (process.env.NODE_ENV === "development") global.prisma = prisma;
