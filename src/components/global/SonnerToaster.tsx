"use client";

import { Toaster } from "sonner";

export default function SonnerToaster() {
    return (
        <Toaster
            position="top-right"
            theme="dark"
            richColors
            toastOptions={{
                style: {
                    backdropFilter: "blur(6px)",
                    background: "rgba(17, 24, 39, 0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    // Force neutral/light text so warning toasts don’t render yellow text
                    color: "#E5E7EB", // tailwind text-gray-200
                },
            }}
        />
    );
}
