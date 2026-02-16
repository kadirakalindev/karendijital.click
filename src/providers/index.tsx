"use client";

import { SessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";
import { BusinessProvider } from "./business-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <BusinessProvider>
          {children}
          <Toaster position="top-right" richColors />
        </BusinessProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
