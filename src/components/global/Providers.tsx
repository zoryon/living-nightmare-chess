"use client";

import AutoRefreshProvider from "@/contexts/AutoRefreshContext";
import { MatchProvider } from "@/contexts/MatchContext";
import ToastProvider from "@/components/global/ToastProvider";
import SonnerToaster from "@/components/global/SonnerToaster";
import SocketEvents from "@/components/global/SocketEvents";
import { ChallengesProvider } from "@/contexts/ChallengesContext";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AutoRefreshProvider>
      <MatchProvider>
        <ChallengesProvider>
          <ToastProvider>
            <SonnerToaster />
            <SocketEvents />
            {children}
          </ToastProvider>
        </ChallengesProvider>
      </MatchProvider>
    </AutoRefreshProvider>
  );
}

export default Providers;