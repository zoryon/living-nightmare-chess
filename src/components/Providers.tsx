"use client";

import AutoRefreshProvider from "@/contexts/AutoRefreshContext";
import { MatchProvider } from "@/contexts/MatchContext";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AutoRefreshProvider>
      <MatchProvider>
        {children}
      </MatchProvider>
    </AutoRefreshProvider>
  );
}

export default Providers;