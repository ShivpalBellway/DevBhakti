"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { NotificationManager } from "@/components/notifications/NotificationManager";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          {children}
          <NotificationManager />
          <Toaster />
          <Sonner />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
