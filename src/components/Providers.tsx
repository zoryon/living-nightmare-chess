"use client";

import AutoRefreshProvider from "@/hooks/AutoRefreshProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AutoRefreshProvider>
      {children}
    </AutoRefreshProvider>
  );
}

export default Providers;