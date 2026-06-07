import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AppSidebar } from "./sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-end">
            {/* Additional header actions can go here */}
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 bg-muted/30">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
