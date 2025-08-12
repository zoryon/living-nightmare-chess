"use client";

import { io, Socket } from "socket.io-client";
import { ensureFreshToken } from "@/lib/auth/refresh-client";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;

  // Make sure we have a fresh access token cookie
  await ensureFreshToken();

  const res = await fetch("/api/auth/token", { credentials: "include" });
  const { token } = (await res.json()) as { token: string };

  // Use a browser-exposed env var in production; fallback to dev localhost
  const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.WEBSOCKET_URL || "http://localhost:3001";

  socket = io(url, {
    transports: ["websocket"],
    withCredentials: true,
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
