"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    IndianRupee,
    Settings,
    Bell,
    LogOut,
    ChevronRight,
    Menu,
    Package,
    Store,
    User,
    PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";

const sellerSidebarItems = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/seller/dashboard",
    },
    {
        label: "My Products",
        icon: Package,
        href: "/seller/dashboard/products",
        subItems: [
            { label: "All Products", href: "/seller/dashboard/products" },
            { label: "Add New Product", href: "/seller/dashboard/products/create" },
        ]
    },
    {
        label: "Orders",
        icon: ShoppingBag,
        href: "/seller/dashboard/orders",
    },
    {
        label: "Payments",
        icon: IndianRupee,
        href: "/seller/dashboard/payments",
    },
    {
        label: "Store Profile",
        icon: Store,
        href: "/seller/dashboard/profile",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/seller/dashboard/settings",
    },
];

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in via localStorage
        const checkAuth = () => {
            const token = localStorage.getItem("seller_token");
            const storedUser = localStorage.getItem("seller_user");

            if (token && storedUser) {
                setIsAuthenticated(true);
                setUser(JSON.parse(storedUser));
            } else {
                setIsAuthenticated(false);
                router.push("/seller");
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("seller_token");
        localStorage.removeItem("seller_user");
        router.push("/seller");
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
        sellerSidebarItems.forEach(item => {
            if (item.subItems) {
                if (item.subItems.some(sub => pathname === sub.href)) {
                    if (!openMenus.includes(item.label)) {
                        setOpenMenus(prev => [...prev, item.label]);
                    }
                }
            }
        });
    }, [pathname]);

    // Show nothing while checking auth to prevent flicker
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Using Admin Deep Indigo theme */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 shadow-xl",
                    sidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2 text-sidebar-foreground font-serif font-bold text-xl">
                            <Store className="w-6 h-6 text-sidebar-primary" />
                            <span>SellerPanel</span>
                        </div>
                    ) : (
                        <Store className="w-8 h-8 text-sidebar-primary mx-auto" />
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto premium-scrollbar">
                    {sellerSidebarItems.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = openMenus.includes(item.label);
                        const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href));

                        if (hasSubItems) {
                            return (
                                <div key={item.label} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                            isActive
                                                ? "bg-sidebar-primary/10 text-sidebar-primary"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                                            {sidebarOpen && (
                                                <span className="font-medium text-sm">{item.label}</span>
                                            )}
                                        </div>
                                        {sidebarOpen && (
                                            <ChevronRight className={cn(
                                                "w-4 h-4 transition-transform duration-200 opacity-50",
                                                isOpen && "rotate-90"
                                            )} />
                                        )}
                                    </button>

                                    {isOpen && sidebarOpen && (
                                        <div className="ml-9 space-y-1 border-l border-sidebar-border pl-2">
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
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
                                {sidebarOpen && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-sidebar-border">
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-xl transition-colors",
                        sidebarOpen ? "" : "justify-center"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold shadow-lg">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                                    {user?.name || "Seller"}
                                </p>
                                <p className="text-xs text-sidebar-foreground/60 truncate">
                                    {user?.phone || ""}
                                </p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            "w-full mt-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all",
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
                <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-sidebar-border flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link href="/seller/dashboard" className="hover:text-sidebar-primary transition-colors font-medium">
                            Seller Portal
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-medium">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground gap-2 rounded-full shadow-lg">
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Product</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-sidebar-primary hover:bg-sidebar-primary/10 rounded-full">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
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
