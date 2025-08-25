import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { detectDeviceType } from "@/lib/utils";
import { NextRequest } from "next/server";
import { transporter } from "@/lib/mailer";
import { signEmailToken } from "@/lib/jwt";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export async function POST(req: NextRequest) {
    const { email, username, password, passwordConfirmation } = await req.json();
    const existingDeviceIdHeader = req.headers.get("x-device-id");

    if (!username || !password || !passwordConfirmation) {
        return new Response(JSON.stringify({ error: "username and password required" }), { status: 400 });
    }

    if (!email || !email.includes("@")) {
        return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
    }

    if (email) {
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    }

    if (passwordConfirmation !== password) {
        return new Response(JSON.stringify({ error: "Passwords do not match" }), { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Enforce unique username now that it is unique in DB
    const existingUsername = await prisma.user.findFirst({ where: { username } });
    if (existingUsername) return new Response(JSON.stringify({ error: "Username already taken" }), { status: 409 });

    const user = await prisma.user.create({
        data: {
            email,
            username,
            passwordHash,
            isEmailVerified: false,
        },
        select: { id: true, email: true, username: true, createdAt: true }
    });

    // Create or use existing device
    let deviceId: number | null = existingDeviceIdHeader ? Number(existingDeviceIdHeader) : null;
    if (deviceId && !Number.isInteger(deviceId)) deviceId = null;

    if (!deviceId) {
        const userAgent = req.headers.get("user-agent") || "";
        const deviceType = detectDeviceType(userAgent);
        const device = await prisma.device.create({
            data: { userId: user.id, userAgent, deviceType },
            select: { id: true }
        });
        deviceId = device.id;
    }

    // Prepare confirmation link
    const token = signEmailToken({ userId: user.id, deviceId });
    const confirmationLink = `${process.env.WEBSITE_URL!}/register/confirm?token=${token}`;

    // Send confirmation email (must await in serverless env so the process doesn't exit early)
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: user.email!,
            subject: "Confirm Your Email",
            html: `<p>Please confirm your email by clicking <a href="${confirmationLink}">here</a>.</p>`,
        });
    } catch (e) {
        console.error("Failed to send confirmation email", e);
        return new Response(JSON.stringify({ error: "email_send_failed" }), { status: 500 });
    }

    return new Response(JSON.stringify({ deviceId }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
