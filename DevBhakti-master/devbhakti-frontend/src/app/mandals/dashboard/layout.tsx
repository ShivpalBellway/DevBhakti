"use client";

import React, { useState, useEffect } from "react";
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
    ShieldCheck,
    X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from "@/assets/logo2.png";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { fetchMandalProfile, fetchMandalOrders, fetchMyMandalBookings } from "@/api/mandalAdminController";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { clearAllTokens } from "@/lib/auth-utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { parseLocalizedValue } from "@/utils/textUtils";

const sidebarItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/mandals/dashboard",
        permission: "dashboard.view"
    },
    {
        label: "Poojas",
        icon: Flower2,
        href: "/mandals/dashboard/poojas",
        permission: "poojas.view"
    },
    {
        label: "Bookings",
        icon: Calendar,
        href: "/mandals/dashboard/bookings"
    },
    {
        label: "Teller Module",
        icon: CreditCard,
        href: "/mandals/dashboard/teller",
        permission: "finance.menu",
        subItems: [
            { label: "Offline Pooja Booking", href: "/mandals/dashboard/teller/offline-pooja", permission: "finance.menu" },
            { label: "Offline Donation", href: "/mandals/dashboard/teller/offline-donation", permission: "finance.menu" },
            { label: "Offline Ticket Booking", href: "/mandals/dashboard/teller/offline-ticket", permission: "finance.menu" },
            { label: "Offline Product Booking", href: "/mandals/dashboard/teller/offline-product", permission: "finance.menu" },
            { label: "Offline Users / Devotees", href: "/mandals/dashboard/teller/offline-users", permission: "finance.menu" },
            { label: " Darshan Ticket Slots", href: "/mandals/dashboard/darshan/slots", permission: "finance.menu" },
        ]
    },
    {
        label: "Events",
        icon: Calendar,
        href: "/mandals/dashboard/events",
        permission: "events.view"
    },
    {
        label: "Donation",
        icon: Heart,
        href: "/mandals/dashboard/donation",
        permission: "donations.menu",
        subItems: [
          { label: "💳 Online Donations", href: "/mandals/dashboard/donation?type=online", permission: "donations.menu" },
        ]
    },
    {
        label: "Product Management",
        icon: Package,
        href: "/mandals/dashboard/products",
        permission: "products.menu"
    },
    {
        label: "Order Management",
        icon: ShoppingBag,
        href: "/mandals/dashboard/orders",
        permission: "products.orders.view",
        subItems: [
            { label: "All Orders", href: "/mandals/dashboard/orders" },
            { label: "Pending", href: "/mandals/dashboard/orders?status=PENDING" },
            { label: "Accepted", href: "/mandals/dashboard/orders?status=ACCEPTED" },
            { label: "Shipped", href: "/mandals/dashboard/orders?status=SHIPPED" },
            { label: "Delivered", href: "/mandals/dashboard/orders?status=DELIVERED" },
            { label: "Cancelled", href: "/mandals/dashboard/orders?status=CANCELLED" },
        ]
    },    
    {
        label: "Devotee Management",
        icon: Users,
        href: "/mandals/dashboard/users",
        permission: "users.view"
    },
    {
        label: "Team Management",
        icon: ShieldCheck,
        href: "/mandals/dashboard/team/staff",
        permission: "team.menu",
        subItems: [
            { label: "👥 Staff Members", href: "/mandals/dashboard/team/staff", permission: "team.staff.view" },
            { label: "🛡️ Roles & Permissions", href: "/mandals/dashboard/team/roles", permission: "team.roles.manage" },
        ]
    },
    {
        label: "Earnings & Settlement",
        icon: CreditCard,
        href: "/mandals/dashboard/finance",
        permission: "finance.menu"
    },
    {
        label: "Profile",
        icon: Settings,
        href: "/mandals/dashboard/profile",
        permission: "mandal.profile.manage"
    },
];

const SidebarNavItem = ({ item, pathname, sidebarOpen, onNavigate }: { item: any, pathname: string, sidebarOpen: boolean, onNavigate?: () => void }) => {
    const searchParams = useSearchParams();
    const subItems = item.subItems;
    const hasSubItems = subItems && subItems.length > 0;
    const [isOpen, setIsOpen] = useState(false);

    const isLinkActive = (href: string) => {
        if (!href) return false;
        const [basePath, queryStr] = href.split('?');
        const isPathMatch = pathname === basePath;

        if (!queryStr) {
            return isPathMatch && Array.from(searchParams.entries()).length === 0;
        }

        const params = new URLSearchParams(queryStr);
        return isPathMatch && Array.from(params.entries()).every(([key, value]) => searchParams.get(key) === value);
    };

    const isSubActive = hasSubItems && subItems.some((sub: any) => isLinkActive(sub.href));
    const isActive = isLinkActive(item.href) || isSubActive;

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
                                    onClick={onNavigate}
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
            onClick={onNavigate}
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

export default function MandalAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { hasPermission } = useAdminAuth();
    // Desktop: sidebar open/collapse; Mobile: drawer open/close
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);
    const [mandalProfile, setMandalProfile] = useState<any>(null);
    const [breadcrumbOverride, setBreadcrumbOverride] = useState<string | null>(null);
    const [counts, setCounts] = useState({
        bookings: { total: 0, booked: 0, completed: 0, cancelled: 0 },
        orders: { total: 0, pending: 0, accepted: 0, shipped: 0, delivered: 0, cancelled: 0 }
    });

    const loadCounts = async () => {
        try {
            try {
                const profileRes = await fetchMandalProfile();
                if (profileRes.success) {
                    setMandalProfile(profileRes.data);
                    if (profileRes.data.id) {
                        fetchMandalOrders(profileRes.data.id)
                            .then(ordersRes => {
                                if (ordersRes.success) {
                                    const data = ordersRes.data;
                                    setCounts((prev: any) => ({
                                        ...prev,
                                        orders: {
                                            total: data.length,
                                            pending: data.filter((o: any) => o.status === 'PENDING').length,
                                            accepted: data.filter((o: any) => o.status === 'ACCEPTED').length,
                                            shipped: data.filter((o: any) => o.status === 'SHIPPED').length,
                                            delivered: data.filter((o: any) => o.status === 'DELIVERED').length,
                                            cancelled: data.filter((o: any) => o.status === 'CANCELLED').length,
                                        }
                                    }));
                                }
                            })
                            .catch((err: any) => console.error("Failed to load orders", err));
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }

            try {
                const bookingsRes = await fetchMyMandalBookings();
                if (bookingsRes.success) {
                    const data = bookingsRes.data;
                    setCounts((prev: any) => ({
                        ...prev,
                        bookings: {
                            total: data.length,
                            booked: data.filter((b: any) => b.status === 'BOOKED').length,
                            completed: data.filter((b: any) => b.status === 'COMPLETED').length,
                            cancelled: data.filter((b: any) => b.status === 'CANCELLED' || b.status === 'REJECTED').length
                        }
                    }));
                }
            } catch (err) {
                console.error("Failed to load bookings", err);
            }
        } catch (error) {
            console.error("Unexpected error in loadCounts", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadCounts();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleUpdate = (e: any) => setBreadcrumbOverride(e.detail);
        window.addEventListener('updateBreadcrumb', handleUpdate);
        return () => window.removeEventListener('updateBreadcrumb', handleUpdate);
    }, []);

    useEffect(() => {
        setBreadcrumbOverride(null);
        // Close mobile drawer on route change
        setMobileDrawerOpen(false);
    }, [pathname]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const isStaffLoginPath = pathname === "/mandals/dashboard/staff-login";

        if (pathname === "/mandals/dashboard/login" || isStaffLoginPath) {
            if (token && storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    if (u.role === "MANDAL" || u.isStaff) {
                        router.push("/mandals/dashboard");
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
            router.push("/register-mandal");
            return;
        }

        try {
            const u = JSON.parse(storedUser);
            if (u.role !== "MANDAL" && !u.isStaff) {
                setIsAuthenticated(false);
                router.push("/auth?mode=login&type=devotee");
                return;
            }
            setUser(u);
            setIsAuthenticated(true);
        } catch (e) {
            setIsAuthenticated(false);
            router.push("/register-mandal");
        }
    }, [pathname, router]);

    const handleSignOut = () => {
        clearAllTokens();
        router.push("/register-mandal");
    };

    if (pathname === "/mandals/dashboard/login" || pathname === "/mandals/dashboard/staff-login") {
        return <>{children}</>;
    }

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

    if (!isAuthenticated && pathname !== "/mandals/dashboard/login") {
        return null;
    }

    const isPrintPage = pathname?.endsWith("/print");
    if (isPrintPage) {
        return <main className="min-h-screen bg-white print:p-0">{children}</main>;
    }

    // Sidebar content reused for both desktop sidebar and mobile drawer
    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Logo */}
            <div className={cn("flex items-center gap-3 h-16 md:h-20 px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm shrink-0", isMobile && "h-16")}>
                {(sidebarOpen || isMobile) ? (
                    <div className="flex items-center gap-3 w-full">
                        <div className="bg-white h-10 w-10 md:h-12 md:w-12 rounded-xl shadow-md border border-sidebar-border/50 shrink-0 overflow-hidden flex items-center justify-center">
                            <div className="relative h-10 w-10 md:h-12 md:w-12">
                                <Image src={logo} alt="Temple Logo" fill className="object-contain" priority />
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-black text-sidebar-primary uppercase tracking-wider leading-none">
                                Mandal Dashboard
                            </span>
                            <span className="text-[10px] font-bold text-sidebar-foreground/60 truncate mt-1">
                                {parseLocalizedValue(mandalProfile?.name) || parseLocalizedValue(user?.name) || "Sacred Portal"}
                            </span>
                        </div>
                        {/* Close button for mobile */}
                        {isMobile && (
                            <button
                                onClick={() => setMobileDrawerOpen(false)}
                                className="ml-auto p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        {/* Collapse button for desktop */}
                        {!isMobile && sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all ml-auto shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white h-12 w-12 rounded-xl shadow-md border border-sidebar-border/50 mx-auto overflow-hidden flex items-center justify-center mt-1">
                        <div className="relative h-12 w-12">
                            <Image src={logo} alt="Temple Logo" fill className="object-contain" priority />
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {sidebarItems
                    .filter(item => !item.permission || hasPermission(item.permission))
                    .map((item) => {
                        let itemWithCounts = { ...item };
                        if (item.label === "Bookings" && item.subItems) {
                            itemWithCounts.subItems = item.subItems.map((sub: any) => {
                                if (sub.label === "All Bookings") return { ...sub, count: counts.bookings.total };
                                if (sub.label === "Booked Poojas") return { ...sub, count: counts.bookings.booked };
                                if (sub.label === "Completed") return { ...sub, count: counts.bookings.completed };
                                if (sub.label === "Cancelled") return { ...sub, count: counts.bookings.cancelled };
                                return sub;
                            });
                        } else if (item.label === "Order Management" && item.subItems) {
                            itemWithCounts.subItems = item.subItems.map((sub: any) => {
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
                                sidebarOpen={sidebarOpen || isMobile}
                                onNavigate={isMobile ? () => setMobileDrawerOpen(false) : undefined}
                            />
                        );
                    })}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-sidebar-border shrink-0">
                <Link
                    href="/mandals/dashboard/profile"
                    onClick={isMobile ? () => setMobileDrawerOpen(false) : undefined}
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
                        (sidebarOpen || isMobile) ? "" : "justify-center"
                    )}
                >
                    <div className="w-9 h-9 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground font-semibold text-sm shrink-0">
                        {(parseLocalizedValue(mandalProfile?.name) || parseLocalizedValue(user?.name) || "I").charAt(0)}
                    </div>
                    {(sidebarOpen || isMobile) && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user?.isStaff && <span className="text-[10px] bg-sidebar-primary/10 text-sidebar-primary px-1.5 py-0.5 rounded mr-1.5 font-bold">STAFF</span>}
                                {parseLocalizedValue(mandalProfile?.name) || parseLocalizedValue(user?.name) || (user?.isStaff ? "Sacred Staff" : "Mandal Admin")}
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
                        !(sidebarOpen || isMobile) && "p-2"
                    )}
                >
                    <LogOut className="w-4 h-4" />
                    {(sidebarOpen || isMobile) && <span className="ml-2">Sign Out</span>}
                </Button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-background flex">

            {/* ── DESKTOP Sidebar (hidden on mobile) ── */}
            <aside
                className={cn(
                    "hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex flex-col bg-sidebar transition-all duration-300 print:hidden",
                    sidebarOpen ? "md:w-64" : "md:w-20"
                )}
                onClick={!sidebarOpen ? () => setSidebarOpen(true) : undefined}
            >
                <SidebarContent isMobile={false} />
            </aside>

            {/* ── MOBILE Drawer Overlay ── */}
            {mobileDrawerOpen && (
                <div
                    className="fixed inset-0 z-50 md:hidden"
                    onClick={() => setMobileDrawerOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    {/* Drawer panel */}
                    <aside
                        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-sidebar shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarContent isMobile={true} />
                    </aside>
                </div>
            )}

            {/* ── Main content ── */}
            <div
                className={cn(
                    "flex-1 transition-all duration-300 print:ml-0 print:w-full min-w-0",
                    // Desktop margin — only one md:ml-* class at a time
                    sidebarOpen ? "md:ml-64" : "md:ml-20"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 h-14 md:h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-3 md:px-6 w-full overflow-hidden print:hidden">
                    <div className="flex items-center gap-1 md:gap-2 text-sm text-muted-foreground capitalize overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5 min-w-0 flex-1">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="p-2 rounded-md hover:bg-muted text-foreground transition-colors md:hidden shrink-0"
                            title="Open Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        {/* Desktop sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md hover:bg-muted text-foreground transition-colors hidden md:block shrink-0"
                            title="Toggle Sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs - hidden on very small screens, show on sm+ */}
                        <div className="hidden sm:flex items-center gap-1 text-sm min-w-0">
                            <Link href="/mandals/dashboard" className="hover:text-foreground transition-colors shrink-0">
                                Mandal Admin
                            </Link>
                            {pathname === '/mandals/dashboard' ? (
                                <>
                                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-foreground font-medium">Dashboard</span>
                                </>
                            ) : (
                                pathname?.split('/').filter(Boolean).slice(2).map((path, index, array) => {
                                    const isLast = index === array.length - 1;
                                    const pathUrl = `/mandals/dashboard/${array.slice(0, index + 1).join('/')}`;
                                    let title = path.replace(/-/g, ' ');
                                    if (/^[0-9a-fA-F]{24}$/.test(path) || /^c[a-z0-9]{24}$/.test(path) || path.length === 36) {
                                        title = "Details";
                                    }
                                    return (
                                        <React.Fragment key={pathUrl}>
                                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                            {isLast ? (
                                                <span className="text-foreground font-medium truncate max-w-[120px] md:max-w-none">{breadcrumbOverride || title}</span>
                                            ) : (
                                                <Link href={pathUrl} className="hover:text-foreground transition-colors truncate max-w-[80px] md:max-w-none">
                                                    {title}
                                                </Link>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>

                        {/* Mobile: show current page title */}
                        <div className="sm:hidden flex items-center gap-1 min-w-0">
                            <span className="text-foreground font-semibold text-sm truncate">
                                {pathname === '/mandals/dashboard'
                                    ? 'Dashboard'
                                    : breadcrumbOverride || pathname?.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'
                                }
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <NotificationBell userId={user?.id || user?.email || ''} userType="temple_admin" />
                        <Button variant="outline" size="sm" asChild className="hidden sm:flex text-xs px-2 md:px-3 h-8 md:h-9">
                            <Link href="/">View Site</Link>
                        </Button>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-3 md:p-6 pb-20 md:pb-6 print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
