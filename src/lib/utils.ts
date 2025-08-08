import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to convert secret string to Uint8Array for jose
function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}