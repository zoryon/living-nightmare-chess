import { PrismaClient } from "../../generated/prisma";

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
