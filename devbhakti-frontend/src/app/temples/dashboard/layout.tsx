"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    Package,
    Calendar,
    Settings,
    Bell,
    LogOut,
    ChevronRight,
    Menu,
    Building2,
    Video,
    CreditCard,
    Flower2,
    Heart,
    ChevronDown,
    ChevronUp,
    ShieldCheck
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
// import Logo from "@/components/icons/Logo";
import logo from "@/assets/logo2.png";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchMyTempleBookings, fetchTempleOrders, fetchMyTempleProfile } from "@/api/templeAdminController";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { clearAllTokens } from "@/lib/auth-utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const sidebarItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/temples/dashboard",
        permission: "dashboard.view"
    },
    {
        label: "Poojas ",
        icon: Flower2,
        href: "/temples/dashboard/poojas",
        permission: "poojas.view"
    },
    {
        label: "Events",
        icon: Calendar,
        href: "/temples/dashboard/events",
        permission: "events.view"
    },
    {
        label: "Devotee Management",
        icon: Users,
        href: "/temples/dashboard/users",
        permission: "users.view"
    },
    {
        label: "Team Management",
        icon: ShieldCheck,
        href: "/temples/dashboard/team/staff",
        permission: "team.menu",
        subItems: [
            { label: "Staff Members", href: "/temples/dashboard/team/staff" },
            { label: "Roles & Permissions", href: "/temples/dashboard/team/roles" },
        ]
    },
    {
        label: "Donations",
        icon: Heart,
        href: "/temples/dashboard/donation",
        permission: "finance.menu"
    },
    {
        label: "Product Management",
        icon: Package,
        href: "/temples/dashboard/products",
        permission: "products.menu"
    },
    {
        label: "Order Management",
        icon: ShoppingBag,
        href: "/temples/dashboard/orders",
        permission: "products.orders.view",
        subItems: [
            { label: "All Orders", href: "/temples/dashboard/orders" },
            { label: "Pending", href: "/temples/dashboard/orders?status=PENDING" },
            { label: "Accepted", href: "/temples/dashboard/orders?status=ACCEPTED" },
            { label: "Shipped", href: "/temples/dashboard/orders?status=SHIPPED" },
            { label: "Delivered", href: "/temples/dashboard/orders?status=DELIVERED" },
            { label: "Cancelled", href: "/temples/dashboard/orders?status=CANCELLED" },
        ]
    },
    {
        label: "Pooja Bookings",
        icon: Calendar,
        href: "/temples/dashboard/bookings",
        permission: "bookings.menu",
        subItems: [
            { label: "All Bookings", href: "/temples/dashboard/bookings" },
            { label: "Booked Poojas", href: "/temples/dashboard/bookings?status=BOOKED" },
            { label: "Completed", href: "/temples/dashboard/bookings?status=COMPLETED" },
            { label: "Cancelled", href: "/temples/dashboard/bookings?status=CANCELLED" },
        ]
    },
    // {
    //     label: "Live Stream",
    //     icon: Video,
    //     href: "/temples/dashboard/live-stream",
    // },
    {
        label: "Earnings & Settlement",
        icon: CreditCard,
        href: "/temples/dashboard/finance",
        permission: "finance.menu"
    },
    {
        label: "Bank Details",
        icon: Building2,
        href: "/temples/dashboard/bank",
        permission: "temple.bank.manage"
    },
    {
        label: "Profile",
        icon: Settings,
        href: "/temples/dashboard/profile",
        permission: "temple.profile.manage"
    },
];
const SidebarNavItem = ({ item, pathname, sidebarOpen }: { item: any, pathname: string, sidebarOpen: boolean }) => {
    const searchParams = useSearchParams();
    const subItems = item.subItems;
    const hasSubItems = subItems && subItems.length > 0;
    const [isOpen, setIsOpen] = useState(false);

    // Helper to check if a link is active including query params
    const isLinkActive = (href: string) => {
        if (!href) return false;
        const [basePath, queryStr] = href.split('?');
        const isPathMatch = pathname === basePath;

        if (!queryStr) {
            // For base paths, we only match if there are NO meaningful search params active for this section
            // or if it's an exact match
            return isPathMatch && Array.from(searchParams.entries()).length === 0;
        }

        const params = new URLSearchParams(queryStr);
        return isPathMatch && Array.from(params.entries()).every(([key, value]) => searchParams.get(key) === value);
    };

    const isSubActive = hasSubItems && subItems.some((sub: any) => isLinkActive(sub.href));
    const isActive = isLinkActive(item.href) || isSubActive;

    // Auto-expand if sub-item is active
    useEffect(() => {
        if (isSubActive) setIsOpen(true);
    }, [isSubActive]);

    if (hasSubItems && sidebarOpen) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isActive && !isOpen
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && !isOpen ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground")} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-40" />}
                </button>

                {isOpen && (
                    <div className="ml-9 space-y-1 border-l border-sidebar-border/50 pl-2">
                        {subItems.map((sub: any) => {
                            const isCurrent = isLinkActive(sub.href);
                            return (
                                <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={cn(
                                        "flex items-center justify-between py-2 px-3 text-xs rounded-md transition-colors",
                                        isCurrent
                                            ? "text-sidebar-primary font-bold bg-sidebar-primary/5"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                    )}
                                >
                                    <span>{sub.label}</span>
                                    {sub.count !== undefined && (
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[10px] min-w-[20px] text-center",
                                            isCurrent ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent text-sidebar-foreground/50"
                                        )}>
                                            {sub.count}
                                        </span>
                                    )}
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
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
        >
            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
            {sidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
            )}
        </Link>
    );
};

export default function TempleAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { hasPermission } = useAdminAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);
    const [templeProfile, setTempleProfile] = useState<any>(null);
    const [counts, setCounts] = useState({
        bookings: { total: 0, booked: 0, completed: 0, cancelled: 0 },
        orders: { total: 0, pending: 0, accepted: 0, shipped: 0, delivered: 0, cancelled: 0 }
    });

    const loadCounts = async () => {
        try {
            const [bookingsRes, profileRes] = await Promise.all([
                fetchMyTempleBookings(),
                fetchMyTempleProfile()
            ]);

            if (profileRes.success) {
                setTempleProfile(profileRes.data);
            }

            let newCounts = { ...counts };

            if (bookingsRes.success) {
                const data = bookingsRes.data;
                newCounts.bookings = {
                    total: data.length,
                    booked: data.filter((b: any) => b.status === 'BOOKED').length,
                    completed: data.filter((b: any) => b.status === 'COMPLETED').length,
                    cancelled: data.filter((b: any) => b.status === 'CANCELLED' || b.status === 'REJECTED').length
                };
            }

            if (profileRes.success && profileRes.data.id) {
                const ordersRes = await fetchTempleOrders(profileRes.data.id);
                if (ordersRes.success) {
                    const data = ordersRes.data;
                    newCounts.orders = {
                        total: data.length,
                        pending: data.filter((o: any) => o.status === 'PENDING').length,
                        accepted: data.filter((o: any) => o.status === 'ACCEPTED').length,
                        shipped: data.filter((o: any) => o.status === 'SHIPPED').length,
                        delivered: data.filter((o: any) => o.status === 'DELIVERED').length,
                        cancelled: data.filter((o: any) => o.status === 'CANCELLED').length,
                    };
                }
            }
            setCounts(newCounts);
        } catch (error) {
            console.error("Failed to load counts", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadCounts();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const isStaffLoginPath = pathname === "/temples/dashboard/staff-login";

        if (pathname === "/temples/dashboard/login" || isStaffLoginPath) {
            if (token && storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    if (u.role === "INSTITUTION" || u.isStaff) {
                        router.push("/temples/dashboard");
                        setIsAuthenticated(true);
                        setUser(u);
                        return;
                    }
                } catch (e) {
                    console.error("Auth error", e);
                }
            }
            setIsAuthenticated(false); // Allow rendering for login pages
            return;
        }

        if (!token || !storedUser) {
            setIsAuthenticated(false);
            router.push("/temples/dashboard/login");
            return;
        }

        try {
            const u = JSON.parse(storedUser);
            if (u.role !== "INSTITUTION" && !u.isStaff) {
                setIsAuthenticated(false);
                router.push("/auth?mode=login&type=devotee");
                return;
            }
            setUser(u);
            setIsAuthenticated(true);
        } catch (e) {
            setIsAuthenticated(false);
            router.push("/temples/dashboard/login");
        }
    }, [pathname, router]);

    const handleSignOut = () => {
        clearAllTokens();
        router.push("/temples/dashboard/login");
    };



    // Skip sidebar/layout for login pages
    if (pathname === "/temples/dashboard/login" || pathname === "/temples/dashboard/staff-login") {
        return <>{children}</>;
    }

    // Show nothing while checking auth to prevent flicker
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sidebar-primary/20 border-t-sidebar-primary rounded-full animate-spin" />
                    <p className="text-sidebar-primary font-serif font-medium animate-pulse">Entering Sacred Portal...</p>
                </div>
            </div>
        );
    }

    // If not authenticated and not on login page, we'll be redirected by useEffect
    if (!isAuthenticated && pathname !== "/temples/dashboard/login") {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 print:hidden",
                    sidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo */}
                {/* Logo */}
                <div className="flex items-center gap-3 h-20 px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 w-full">
                            <div className="bg-white h-16 w-16 rounded-xl shadow-md border border-sidebar-border/50 shrink-0 overflow-hidden flex items-center justify-center translate-y-[-2px]">
                                <div className="relative h-16 w-16">
                                    <Image
                                        src={logo}
                                        alt="Temple Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-black text-sidebar-primary uppercase tracking-wider leading-none">
                                    Temple Dashboard
                                </span>
                                <span className="text-[11px] font-bold text-sidebar-foreground/60 truncate mt-1">
                                    {templeProfile?.name || user?.name || "Sacred Portal"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white h-12 w-12 rounded-xl shadow-md border border-sidebar-border/50 mx-auto overflow-hidden flex items-center justify-center mt-1">
                            <div className="relative h-12 w-12">
                                <Image
                                    src={logo}
                                    alt="Temple Logo"
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
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {sidebarItems
                        .filter(item => !item.permission || hasPermission(item.permission))
                        .map((item) => {
                            // Dynamically inject counts into subItems
                            let itemWithCounts = { ...item };
                            if (item.label === "Pooja Bookings" && item.subItems) {
                                itemWithCounts.subItems = item.subItems.map(sub => {
                                    if (sub.label === "All Bookings") return { ...sub, count: counts.bookings.total };
                                    if (sub.label === "Booked Poojas") return { ...sub, count: counts.bookings.booked };
                                    if (sub.label === "Completed") return { ...sub, count: counts.bookings.completed };
                                    if (sub.label === "Cancelled") return { ...sub, count: counts.bookings.cancelled };
                                    return sub;
                                });
                            } else if (item.label === "Order Management" && item.subItems) {
                                itemWithCounts.subItems = item.subItems.map(sub => {
                                    if (sub.label === "All Orders") return { ...sub, count: counts.orders.total };
                                    if (sub.label === "Pending") return { ...sub, count: counts.orders.pending };
                                    if (sub.label === "Accepted") return { ...sub, count: counts.orders.accepted };
                                    if (sub.label === "Shipped") return { ...sub, count: counts.orders.shipped };
                                    if (sub.label === "Delivered") return { ...sub, count: counts.orders.delivered };
                                    if (sub.label === "Cancelled") return { ...sub, count: counts.orders.cancelled };
                                    return sub;
                                });
                            }

                            return (
                                <SidebarNavItem
                                    key={item.label}
                                    item={itemWithCounts}
                                    pathname={pathname}
                                    sidebarOpen={sidebarOpen}
                                />
                            );
                        })}
                </nav>

                {/* User section */}
                <div className="p-3 border-t border-sidebar-border">
                    <Link
                        href="/temples/dashboard/profile"
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
                            sidebarOpen ? "" : "justify-center"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground font-semibold">
                            {(templeProfile?.name || user?.name || "I").charAt(0)}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {templeProfile?.name || user?.name || "Temple Admin"}
                                </p>
                                <p className="text-xs text-sidebar-foreground/60 truncate">
                                    {user?.phone || user?.email || "admin@temple.com"}
                                </p>
                            </div>
                        )}
                    </Link>
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
                    "flex-1 transition-all duration-300 print:ml-0 print:w-full",
                    sidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 w-full overflow-hidden print:hidden">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground capitalize overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
                        <Link href="/temples/dashboard" className="hover:text-foreground transition-colors">
                            Temple Admin
                        </Link>
                        {pathname === '/temples/dashboard' ? (
                            <>
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                <span className="text-foreground font-medium">Dashboard</span>
                            </>

                        ) : (
                            pathname?.split('/').filter(Boolean).slice(2).map((path, index, array) => {
                                const isLast = index === array.length - 1;
                                const pathUrl = `/temples/dashboard/${array.slice(0, index + 1).join('/')}`;
                                const title = path.replace(/-/g, ' ');

                                return (
                                    <React.Fragment key={pathUrl}>
                                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                        {isLast ? (
                                            <span className="text-foreground font-medium">{title}</span>
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
                        <NotificationBell userId={user?.id || user?.email || ''} userType="temple_admin" />
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/">View Site</Link>
                        </Button>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6 print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
