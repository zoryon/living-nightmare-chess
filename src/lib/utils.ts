import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to convert secret string to Uint8Array for jose
function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

// Extract client IP using standard headers (no third-party service). In Next.js
// behind reverse proxies (Vercel, etc.) x-forwarded-for contains a comma list.
export function extractClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null; // Remote IP not available in edge/runtime API without Node req
}

export function detectDeviceType(userAgent: string | null): "desktop" | "mobile" | "tablet" | "bot" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|crawling/i.test(ua)) return "bot";
  if (/mobile/i.test(ua) && !/tablet/i.test(ua)) return "mobile";
  if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (/windows|macintosh|linux|x11/i.test(ua)) return "desktop";
  return "unknown";
}

// Basic geo derivation (nation/region) purposely omitted to avoid external calls.
// You can later integrate a free MaxMind lite DB offline if desired.