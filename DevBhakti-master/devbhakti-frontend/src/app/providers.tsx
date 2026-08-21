"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { GoogleAnalyticsTracker } from "@/components/analytics/GoogleAnalyticsTracker";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <CartProvider>
            <GoogleAnalyticsTracker />
            {children}
            <NotificationManager />
            <Toaster />
            <Sonner />
          </CartProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
