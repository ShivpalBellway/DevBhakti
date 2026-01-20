"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  ShoppingBag,
  CreditCard,
  Video,
  FileText,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  Image as ImageIcon,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Institutions",
    icon: Building2,
    href: "/admin/institutions",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Bookings",
    icon: Calendar,
    href: "/admin/bookings",
  },
  {
    label: "Poojas",
    icon: Flower2,
    href: "/admin/poojas",
  },
  {
    label: "Events",
    icon: Calendar,
    href: "/admin/events",
  },
  {
    label: "CMS",
    icon: FileText,
    href: "#",
    subItems: [
      { label: "Manage Banners", href: "/admin/cms/banners" },
      { label: "Manage Features", href: "/admin/cms/features" },
    ]
  },
  {
    label: "Marketplace",
    icon: ShoppingBag,
    href: "/admin/marketplace",
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/admin/payments",
  },
  {
    label: "Live Darshan",
    icon: Video,
    href: "/admin/live-darshan",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname?.startsWith("/admin/login");

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const isLoggedIn = cookies.some((cookie) => cookie.trim().startsWith("admin_logged_in=true"));

      setIsAuthenticated(isLoggedIn);

      if (!isLoggedIn && !isLoginPage) {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  const handleSignOut = () => {
    document.cookie = "admin_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
  };

  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    if (openMenus.includes(label)) {
      setOpenMenus(openMenus.filter((item) => item !== label));
    } else {
      setOpenMenus([...openMenus, label]);
    }
  };

  useEffect(() => {
    // Open menus if a sub-item is active
    sidebarItems.forEach(item => {
      if (item.subItems) {
        if (item.subItems.some(sub => pathname === sub.href)) {
          if (!openMenus.includes(item.label)) {
            setOpenMenus(prev => [...prev, item.label]);
          }
        }
      }
    });
  }, [pathname]);

  // If we're on the login page, don't show the admin layout UI
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show nothing while checking auth to prevent flicker
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, we'll be redirected by useEffect
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {sidebarOpen ? (
            <Logo size="sm" />
          ) : (
            <Logo size="sm" variant="icon" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href));

            if (hasSubItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </div>
                    {sidebarOpen && (
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen && "rotate-90"
                      )} />
                    )}
                  </button>

                  {isOpen && sidebarOpen && (
                    <div className="ml-9 space-y-1">
                      {item.subItems!.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block px-3 py-2 rounded-md text-sm transition-colors",
                              isSubActive
                                ? "text-sidebar-primary font-medium bg-sidebar-primary/5"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>


        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg",
            sidebarOpen ? "" : "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-semibold">
              A
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Admin User
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  admin@devbhakti.com
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              "w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              !sidebarOpen && "p-2"
            )}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">View Site</Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
