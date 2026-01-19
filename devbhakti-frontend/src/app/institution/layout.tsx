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
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";

const sidebarItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/institution",
    },
    {
        label: "User Management",
        icon: Users,
        href: "/institution/users",
    },
    {
        label: "Product Management",
        icon: Package,
        href: "/institution/products",
    },
    {
        label: "Order Management",
        icon: ShoppingBag,
        href: "/institution/orders",
    },
    {
        label: "Pooja Bookings",
        icon: Calendar,
        href: "/institution/bookings",
    },
    {
        label: "Live Stream",
        icon: Video,
        href: "/institution/live-stream",
    },
    {
        label: "Payments",
        icon: CreditCard,
        href: "/institution/payments",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/institution/settings",
    },
];

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
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
                            T
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    Temple Admin
                                </p>
                                <p className="text-xs text-sidebar-foreground/60 truncate">
                                    admin@temple.com
                                </p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
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
                        <Link href="/institution" className="hover:text-foreground transition-colors">
                            Institution
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
