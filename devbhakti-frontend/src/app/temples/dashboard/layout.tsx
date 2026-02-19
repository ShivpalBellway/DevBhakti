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
    ChevronUp
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

const sidebarItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/temples/dashboard",
    },
    {
        label: "Poojas ",
        icon: Flower2,
        href: "/temples/dashboard/poojas",
    },
    {
        label: "Events",
        icon: Calendar,
        href: "/temples/dashboard/events",
    },
    {
        label: "Devotee Management",
        icon: Users,
        href: "/temples/dashboard/users",
    },
    {
        label: "Donations",
        icon: Heart,
        href: "/temples/dashboard/donation",
    },
    {
        label: "Product Management",
        icon: Package,
        href: "/temples/dashboard/products",
    },
    {
        label: "Order Management",
        icon: ShoppingBag,
        href: "/temples/dashboard/orders",
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
    },
    {
        label: "Bank Details",
        icon: Building2,
        href: "/temples/dashboard/bank",
    },
    {
        label: "Profile",
        icon: Settings,
        href: "/temples/dashboard/profile",
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
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);
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

        if (pathname === "/temples/dashboard/login") {
            if (token && storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    if (u.role === "INSTITUTION") {
                        router.push("/temples/dashboard");
                        setIsAuthenticated(true);
                        setUser(u);
                        return;
                    }
                } catch (e) {
                    console.error("Auth error", e);
                }
            }
            setIsAuthenticated(false);
            return;
        }

        if (!token || !storedUser) {
            setIsAuthenticated(false);
            router.push("/temples/dashboard/login");
            return;
        }

        try {
            const u = JSON.parse(storedUser);
            if (u.role !== "INSTITUTION") {
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/temples/dashboard/login");
    };

    // Skip sidebar/layout for login page
    if (pathname === "/temples/dashboard/login") {
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
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo */}
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
                                Temple Dashboard
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
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map((item) => {
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
                            {user?.name?.charAt(0) || "I"}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {user?.name || "Temple Admin"}
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
                    "flex-1 transition-all duration-300",
                    sidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/temples/dashboard" className="hover:text-foreground transition-colors">
                            Temple Admin
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
