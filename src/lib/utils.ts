import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Behind reverse proxies (Vercel, etc.) x-forwarded-for contains a comma list.
export function extractClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0];
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

export function getGeolocation(headers: Headers) {
  const countryCode = headers.get("X-Vercel-IP-Country");
  const regionCode = headers.get("X-Vercel-IP-Country-Region");

  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  const country = countryCode ? regionNames.of(countryCode) : "Unknown";

  return { country, region: regionCode };
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