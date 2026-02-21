"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  ShoppingBag,
  CreditCard,
  IndianRupee,
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
  Package,
  Store,
  UserCog,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/assets/logo2.png";
import AccessDeniedPage from "./access-denied/page";
import { clearAllTokens } from "@/lib/auth-utils";

const sidebarItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    permission: "dashboard.view",
  },
  {
    label: "Temples",
    icon: Building2,
    href: "#",
    permission: "temples.menu",
    subItems: [
      { label: "All Temples", href: "/admin/temples", permission: "temples.view" },
      { label: "Verification Requests", href: "/admin/temples/update-requests", permission: "temples.requests_view" },
    ]
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    permission: "users.menu",
  },
  {
    label: "Pooja Bookings",
    icon: Calendar,
    href: "/admin/pooja-bookings",
    permission: "bookings.menu",
  },
  {
    label: "Donation",
    icon: Heart,
    href: "/admin/donation",
    permission: "donations.menu",
  },
  {
    label: "Poojas",
    icon: Flower2,
    href: "/admin/poojas",
    permission: "poojas.view",
  },
  {
    label: "Product Management",
    icon: Package,
    href: "#",
    permission: "products.menu",
    subItems: [
      { label: "All Products", href: "/admin/products", permission: "products.view" },
      { label: "Product Categories", href: "/admin/products/categories", permission: "categories.view" },
      { label: "Product Orders", href: "/admin/products/orders", permission: "products.orders.view" }
    ]
  },
  {
    label: "Events",
    icon: Calendar,
    href: "/admin/events",
    permission: "events.view",
  },
  {
    label: "CMS",
    icon: FileText,
    href: "#",
    permission: "cms.menu",
    subItems: [
      { label: "Manage Banners", href: "/admin/cms/banners", permission: "cms.banners" },
      { label: "Manage Features", href: "/admin/cms/features", permission: "cms.features" },
      { label: "Manage Testimonials", href: "/admin/cms/testimonials", permission: "cms.testimonials" },
      { label: "Manage CTA Cards", href: "/admin/cms/cta-cards", permission: "cms.features" },
    ]
  },
  {
    label: "Finance & Payouts",
    icon: IndianRupee,
    href: "#",
    permission: "finance.menu",
    subItems: [
      { label: "Transaction Ledger", href: "/admin/finance/ledger", permission: "finance.ledger.view" },
      { label: "Withdrawal Requests", href: "/admin/finance/withdrawals", permission: "finance.withdrawals.view" },
      { label: "Approvals", href: "/admin/finance/approvals", permission: "finance.withdrawals.action" }
    ]
  },
  {
    label: "Live Darshan",
    icon: Video,
    href: "/admin/live-darshan",
    permission: "live_darshan.view",
  },
  {
    label: "Sellers",
    icon: Store,
    href: "/admin/sellers",
    permission: "sellers.view",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "#",
    permission: "settings.commission",
    subItems: [
      { label: "Commission Slabs", href: "/admin/commission-slabs", permission: "settings.commission" },
    ]
  },
  {
    label: "Team Management",
    icon: UserCog,
    href: "#",
    permission: "team.menu",
    subItems: [
      { label: "Staff Members", href: "/admin/team/staff", permission: "team.staff.view" },
      { label: "Roles & Permissions", href: "/admin/team/roles", permission: "team.roles.manage" },
    ]
  },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; isStaff?: boolean; permissions?: string[] } | null>(null);

  const isLoginPage = pathname?.startsWith("/admin/login") || pathname?.startsWith("/admin/staff-login");

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const isLoggedIn = cookies.some((cookie) => cookie.trim().startsWith("admin_logged_in=true"));

      // Also check staff_token in localStorage
      const staffToken = localStorage.getItem("staff_token");
      const adminToken = localStorage.getItem("admin_token");
      const hasToken = !!staffToken || !!adminToken;

      setIsAuthenticated(isLoggedIn && hasToken);

      if (isLoggedIn && hasToken) {
        const adminUser = localStorage.getItem("admin_user");
        const staffUser = localStorage.getItem("staff_user");
        if (staffUser) {
          const parsed = JSON.parse(staffUser);
          setUser({ ...parsed, isStaff: true });
        } else if (adminUser) {
          setUser(JSON.parse(adminUser));
        }
      }

      if ((!isLoggedIn || !hasToken) && !isLoginPage) {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  const handleSignOut = () => {
    clearAllTokens();
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

  // Permission check helper
  const hasPermission = (permission?: string) => {
    if (!user) return false;
    if (!user.isStaff) return true; // Super Admin has all permissions
    if (!permission) return true;
    return user.permissions?.includes(permission);
  };

  // Filter sidebar items based on permissions
  const filteredSidebarItems = sidebarItems.filter(item => {
    const mainVisible = hasPermission(item.permission);
    if (!mainVisible) return false;

    // Optional: Filter sub-items too
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter(sub => hasPermission(sub.permission));
      // If none of the sub-items are visible, maybe hide the main category?
      // For now, only hide if it's a category head ('#')
      if (item.href === "#" && visibleSubItems.length === 0) return false;
    }

    return true;
  });

  // Direct access protection (URL protection)
  const isAuthorized = () => {
    if (!user) return false;
    if (!user.isStaff) return true; // Super Admin always authorized

    // Some pages are always public (e.g. Dashboard)
    if (pathname === "/admin" || pathname === "/admin/access-denied") return true;

    // Find the item corresponding to current pathname
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.href === pathname) return item;
        if (item.subItems) {
          const found = findItem(item.subItems);
          if (found) return found;
        }
      }
      return null;
    };

    const currentItem = findItem(sidebarItems);
    if (!currentItem) return true; // If page not in sidebar, allow (until we define more)

    return hasPermission(currentItem.permission);
  };

  const authorized = isAuthorized();

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
        <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border">
          {sidebarOpen ? (
            <div className="flex flex-col gap-0.5">
              <div className="relative h-10 w-32">
                <Image
                  src={logo}
                  alt="Temple Logo"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
              <span className="text-[15px] font-bold text-sidebar-foreground/90 uppercase tracking-widest pl-2 mt-1">
                Devbhakti Admin
              </span>
            </div>
          ) : (
            <div className="relative h-8 w-8">
              <Image
                src={logo}
                alt="Temple Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto premium-scrollbar">
          {filteredSidebarItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.label);
            const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href));

            if (hasSubItems) {
              // Filter sub-items for rendering
              const visibleSubItems = item.subItems!.filter(sub => hasPermission(sub.permission));

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
                      {visibleSubItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            prefetch={false}
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
                prefetch={false}
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
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || "..."}
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
          {authorized ? children : <AccessDeniedPage />}
        </main>
      </div>
    </div>
  );
}
