import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/shell/command-palette";
import { PageTransition } from "@/components/shell/page-transition";
import { AlertBanner } from "@/components/live/alert-banner";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-screen relative">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <Topbar />
        <AlertBanner />
        <main className="flex flex-1 flex-col min-h-0 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
      </div>
      <CommandPalette />
    </div>
  );
}
