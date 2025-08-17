"use client";

import { io, Socket } from "socket.io-client";
import { ensureFreshToken } from "@/lib/auth/refresh-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

function resolveWsUrl(): string {
  // Priority: explicit public var -> explicit private var -> infer from location -> localhost
  let raw =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
    process.env.WEBSOCKET_URL ||
    "";

  try {
    if (!raw && typeof window !== "undefined") {
      // Try same host with port override if provided, else same origin
      const port = process.env.WEBSOCKET_PORT;
      const u = new URL(window.location.origin);
      if (port) u.port = String(port);
      // Upgrade protocol to ws(s)
      u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
      return u.toString();
    }
    if (raw) {
      const u = new URL(raw);
      // If page is https but URL is http, upgrade to wss to avoid mixed content
      if (typeof window !== "undefined" && window.location.protocol === "https:" && u.protocol !== "wss:") {
        u.protocol = "wss:";
      }
      // If page is http and URL is https, prefer wss anyway (works over https origins)
      if (u.protocol === "http:") u.protocol = "ws:";
      if (u.protocol === "https:") u.protocol = "wss:";
      return u.toString();
    }
  } catch {
    // fallthrough
  }
  return "ws://localhost:3001";
}

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;
  if (connecting) return connecting;

  // Make sure we have a fresh access token cookie
  await ensureFreshToken();

  const res = await fetch("/api/auth/token", { method: "GET", credentials: "include" });
  const { token } = (await res.json()) as { token: string };

  // Resolve proper ws/wss URL depending on deployment
  const url = resolveWsUrl();

  connecting = new Promise<Socket>((resolve, reject) => {
    const s = io(url, {
      transports: ["websocket", "polling"],
      withCredentials: false, // we authenticate via jwt in auth payload
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });

    s.on("connect", () => {
      socket = s;
      connecting = null;
      resolve(s);
    });
    s.on("connect_error", (err: any) => {
      // Small visibility to help diagnose prod issues
      console.warn("WS connect_error", { message: err?.message, data: err?.data });
    });
    s.on("error", (err: any) => {
      console.warn("WS error", err);
    });
    // If it fails to connect initially, reject once after timeout; reconnection keeps trying in background
    setTimeout(() => {
      if (!s.connected) {
        // Keep the reconnection running, but resolve the promise so callers proceed with a socket instance
        // If needed, callers can await s.connected via event listeners
        resolve(s);
      }
    }, 12000);
  });

  return connecting;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
