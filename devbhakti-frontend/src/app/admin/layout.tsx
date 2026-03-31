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
  Megaphone,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/assets/logo2.png";
import AccessDeniedPage from "./access-denied/page";
import { clearAllTokens } from "@/lib/auth-utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

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
      // { label: "Verification Requests", href: "/admin/temples/update-requests", permission: "temples.requests_view" },
    ]
  },
  {
    label: "Users Management",
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
    label: "Product Order",
    icon: ShoppingBag,
    href: "/admin/products/orders",
    permission: "products.orders.view",
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
    href: "#",
    permission: "poojas.view",
    subItems: [
      { label: "All Poojas", href: "/admin/poojas", permission: "poojas.view" },
      { label: "Pooja Purposes", href: "/admin/poojas/categories", permission: "poojas.view" },
      { label: "Standard FAQs", href: "/admin/faqs", permission: "poojas.view" },
    ]
  },
  {
    label: "Product Management",
    icon: Package,
    href: "#",
    permission: "products.menu",
    subItems: [
      { label: "All Products", href: "/admin/products", permission: "products.view" },
      { label: "Product Categories", href: "/admin/products/categories", permission: "categories.view" },
      // { label: "Product Orders", href: "/admin/products/orders", permission: "products.orders.view" }
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
      { label: "Manage Rating", href: "/admin/cms/manage-rating", permission: "cms.features" },
      { label: "Manage Testimonials", href: "/admin/cms/testimonials", permission: "cms.testimonials" },
      { label: "Manage CTA Cards", href: "/admin/cms/cta-cards", permission: "cms.features" },
      // { label: "SEO Meta Tags", href: "/admin/cms/seo", permission: "cms.features" },
    ]

  },
  {
    label: "Finance & Payouts",
    icon: IndianRupee,
    href: "#",
    permission: "finance.menu",
    subItems: [
      { label: "Transaction Overview", href: "/admin/finance/ledger", permission: "finance.ledger.view" },
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
  // {
  //   label: "Marketing",
  //   icon: Megaphone,
  //   href: "/admin/marketing",
  //   permission: "marketing.view",
  // },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ id?: string; name: string; email: string; isStaff?: boolean; permissions?: string[]; role?: string } | null>(null);
  const [breadcrumbOverride, setBreadcrumbOverride] = useState<string | null>(null);


  const isLoginPage = pathname?.startsWith("/admin/login") || pathname?.startsWith("/admin/staff-login");
  const isPrintPage = pathname === "/admin/products/orders/print";

  useEffect(() => {
    // Open sidebar by default on large screens
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
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
          setUser({ ...parsed, isStaff: true, role: parsed.role || "DevBhakti Staff" });
        } else if (adminUser) {
          const parsed = JSON.parse(adminUser);
          setUser({ ...parsed, isStaff: false, role: parsed.role || "DevBhakti Admin" });
        }
      }

      if ((!isLoggedIn || !hasToken) && !isLoginPage) {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  useEffect(() => {
    const handleUpdate = (e: any) => setBreadcrumbOverride(e.detail);
    window.addEventListener('updateBreadcrumb', handleUpdate);
    return () => {
      window.removeEventListener('updateBreadcrumb', handleUpdate);
    };
  }, []);

  useEffect(() => {
    setBreadcrumbOverride(null);
  }, [pathname]);


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

  // If we're on the login or print page, don't show the admin layout UI
  if (isLoginPage || isPrintPage) {
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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-20 px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full">
              <div className="bg-white h-16 w-16 rounded-xl shadow-md border border-sidebar-border/50 shrink-0 overflow-hidden flex items-center justify-center translate-y-[-2px]">
                <div className="relative h-16 w-16">
                  <Image
                    src={logo}
                    alt="DevBhakti Admin Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-black text-sidebar-primary uppercase tracking-wider leading-none">
                  DevBhakti Admin
                </span>
                <span className="text-[11px] font-bold text-sidebar-foreground/60 truncate mt-1">
                  {user?.role?.toUpperCase() === "ADMIN" ? "Super Admin" : (user?.role ? user.role.replace(/_/g, " ") : "Admin Access")}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white h-12 w-12 rounded-xl shadow-md border border-sidebar-border/50 mx-auto overflow-hidden flex items-center justify-center mt-1">
              <div className="relative h-12 w-12">
                <Image
                  src={logo}
                  alt="DevBhakti Admin Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all ml-auto shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
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
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 w-full overflow-hidden">
          <div className="flex items-center gap-2 text-sm text-muted-foreground capitalize overflow-x-auto whitespace-nowrap premium-scrollbar pb-1">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
            {pathname === '/admin' ? (
              <>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <span className="text-foreground font-medium">Dashboard</span>
              </>
            ) : (
              pathname?.split('/').filter(Boolean).slice(1).map((path, index, array) => {
                const isLast = index === array.length - 1;
                const pathUrl = `/admin/${array.slice(0, index + 1).join('/')}`;
                const title = path.replace(/-/g, ' ');

                return (
                  <React.Fragment key={pathUrl}>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    {isLast ? (
                      <span className="text-foreground font-medium">
                        {breadcrumbOverride || title}
                      </span>
                    ) : (
                      <Link href={pathUrl} className="hover:text-foreground transition-colors">
                        {title}
                      </Link>

                    )}

                  </React.Fragment>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userId={user?.id || ''} userType="admin" />
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
