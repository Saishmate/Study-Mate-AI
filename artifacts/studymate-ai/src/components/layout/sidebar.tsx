import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Home, FileText, Bookmark, LogOut, Settings, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";

export function AppSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
      }
    });
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Notes", href: "/notes", icon: FileText },
    { label: "Saved Content", href: "/saved", icon: Bookmark },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <div className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
          <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            S
          </div>
          StudyMate AI
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 mb-2">
            <Link href="/notes/new" className="w-full">
              <span className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2 px-4 rounded-md font-medium text-sm shadow-sm" data-testid="button-new-note">
                <PlusCircle className="w-4 h-4" />
                New Note
              </span>
            </Link>
          </div>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} data-testid={`link-sidebar-${item.label.toLowerCase().replace(" ", "-")}`}>
                        <span className="flex items-center w-full gap-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <span className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-sidebar-accent"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
