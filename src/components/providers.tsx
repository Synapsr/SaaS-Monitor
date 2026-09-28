"use client";

import { ThemeProvider } from "next-themes";
import { z } from "zod";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Zod compiles schemas with `new Function` when it can. The Content-Security-Policy forbids it,
// and probing for it would log a violation on every page, including unattended wall displays.
z.config({ jitless: true });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
