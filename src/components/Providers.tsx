"use client";

import { usePathname } from "next/navigation";

import AutoRefreshProvider from "@/contexts/AutoRefreshContext";
import { MatchProvider } from "@/contexts/MatchContext";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <AutoRefreshProvider>
      <MatchProvider>
        {children}
      </MatchProvider>
    </AutoRefreshProvider>
  );
}

export default Providers;