"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { StreamProvider } from "@/lib/ws/stream-provider";
import { SystemStateBinder } from "@/components/shell/system-state-binder";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StreamProvider>
        <SystemStateBinder />
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          toastOptions={{
            classNames: {
              toast:
                "!bg-[var(--color-bg-elevated)] !text-[var(--color-fg-primary)] !border-[var(--color-border-default)] !backdrop-blur-xl",
              title: "!font-medium !tracking-tight",
              description: "!text-[var(--color-fg-secondary)]",
            },
          }}
        />
      </StreamProvider>
    </QueryClientProvider>
  );
}
