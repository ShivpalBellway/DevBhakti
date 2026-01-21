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
    Flower2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        label: "User Management",
        icon: Users,
        href: "/temples/dashboard/users",
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
    },
    {
        label: "Pooja Bookings",
        icon: Calendar,
        href: "/temples/dashboard/bookings",
    },
    {
        label: "Live Stream",
        icon: Video,
        href: "/temples/dashboard/live-stream",
    },
    {
        label: "Payments",
        icon: CreditCard,
        href: "/temples/dashboard/payments",
    },
    {
        label: "Profile",
        icon: Settings,
        href: "/temples/dashboard/profile",
    },
];

export default function TempleAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);

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
                    <div className="w-12 h-12 border-4 border-[#7b4623]/20 border-t-[#7b4623] rounded-full animate-spin" />
                    <p className="text-[#7b4623] font-serif font-medium animate-pulse">Entering Sacred Portal...</p>
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
                        const hasSubItems = (item as any).subItems && (item as any).subItems.length > 0;
                        const isActive = pathname === item.href || ((item as any).subItems?.some((sub: any) => pathname === sub.href));

                        if (hasSubItems) {
                            // Sub-item logic if needed in future
                            return null;
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-sidebar-foreground/70")} />
                                {sidebarOpen && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </Link>
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
