"use client";

import { usePathname } from "next/navigation";

import AutoRefreshProvider from "@/contexts/AutoRefreshContext";
import { MatchProvider } from "@/contexts/MatchContext";
import ToastProvider from "@/components/global/ToastProvider";
import SonnerToaster from "@/components/global/SonnerToaster";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <AutoRefreshProvider>
      <MatchProvider>
        <ToastProvider>
          <SonnerToaster />
          {children}
        </ToastProvider>
      </MatchProvider>
    </AutoRefreshProvider>
  );
}

export default Providers;