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
    PlusCircle,
    Clock,
    CheckCircle,
    Truck,
    PackageCheck,
    XCircle,
    Wallet,
    Building2,
    CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { cn } from "@/lib/utils";
import { fetchSellerProfile } from "@/api/sellerController";
import { BASE_URL } from "@/config/apiConfig";

const sellerSidebarGroups = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/seller/dashboard" }
        ]
    },
    {
        title: "Inventory",
        items: [
            { label: "Product List", icon: Package, href: "/seller/dashboard/products" },
            { label: "Add Product", icon: PlusCircle, href: "/seller/dashboard/products/create" }
        ]
    },
    {
        title: "Orders",
        items: [
            { label: "All Orders", icon: ShoppingBag, href: "/seller/dashboard/orders" },
            { label: "Pending", icon: Clock, href: "/seller/dashboard/orders?status=pending" },
            { label: "Accepted", icon: CheckCircle, href: "/seller/dashboard/orders?status=accepted" },
            { label: "Shipped", icon: Truck, href: "/seller/dashboard/orders?status=shipped" },
            { label: "Delivered", icon: PackageCheck, href: "/seller/dashboard/orders?status=delivered" },
            { label: "Cancelled", icon: XCircle, href: "/seller/dashboard/orders?status=cancelled" },
        ]
    },
    {
        title: "Finance",
        items: [
            { label: "Transactions", icon: IndianRupee, href: "/seller/dashboard/payments" },
            { label: "Withdrawals Request", icon: Wallet, href: "/seller/dashboard/payments/withdraw" },
            { label: "Payout History", icon: CalendarCheck, href: "/seller/dashboard/payments/history" },
            { label: "Bank Details", icon: Building2, href: "/seller/dashboard/payments/bank-details" }
        ]
    },
    {
        title: "Profile",
        items: [
            { label: "Store Profile", icon: Store, href: "/seller/dashboard/profile" }
        ]
    }
];

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);
    const [storeConfig, setStoreConfig] = useState<{ name?: string, logo?: string } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("seller_token");
            const storedUser = localStorage.getItem("seller_user");

            if (token && storedUser) {
                setIsAuthenticated(true);
                setUser(JSON.parse(storedUser));
                try {
                    const res = await fetchSellerProfile();
                    if (res.success && res.data) {
                        setStoreConfig({
                            name: res.data.name,
                            logo: res.data.image ? `${BASE_URL}${res.data.image}` : undefined
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch store profile", error);
                }
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


    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shadow-xl",
                    sidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            {storeConfig?.logo ? (
                                <img
                                    src={storeConfig.logo}
                                    alt="Store Logo"
                                    className="w-8 h-8 rounded-lg object-cover border border-sidebar-border shadow-sm shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center shrink-0">
                                    <Store className="w-5 h-5 text-sidebar-primary" />
                                </div>
                            )}
                            <span className="font-serif font-bold text-lg text-sidebar-foreground truncate">
                                {storeConfig?.name || "Seller Panel"}
                            </span>
                        </div>
                    ) : (
                        storeConfig?.logo ? (
                            <img
                                src={storeConfig.logo}
                                alt="Store Logo"
                                className="w-9 h-9 rounded-lg object-cover border border-sidebar-border shadow-sm mx-auto"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-lg bg-sidebar-primary/10 flex items-center justify-center mx-auto">
                                <Store className="w-5 h-5 text-sidebar-primary" />
                            </div>
                        )
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto premium-scrollbar">
                    {sellerSidebarGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            {sidebarOpen && (
                                <h3 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/40">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "w-5 h-5 flex-shrink-0 transition-colors",
                                                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                                                )}
                                            />
                                            {sidebarOpen && (
                                                <span className="text-sm">{item.label}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                            {sidebarOpen && groupIndex < sellerSidebarGroups.length - 1 && (
                                <div className="mx-3 mt-4 h-px bg-sidebar-border/50" />
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-sidebar-border">
                    <Link
                        href="/seller/dashboard/profile"
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-sidebar-accent cursor-pointer block",
                            sidebarOpen ? "" : "justify-center"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold shadow-sm border border-sidebar-border">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-sidebar-foreground truncate">
                                    {user?.name || "Seller"}
                                </p>
                                <p className="text-xs text-sidebar-foreground/60 truncate font-medium">
                                    {user?.phone || ""}
                                </p>
                            </div>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn(
                            "w-full mt-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all",
                            !sidebarOpen && "p-2"
                        )}
                    >
                        <LogOut className="w-4 h-4" />
                        {sidebarOpen && <span className="ml-2 font-medium">Sign Out</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div
                className={cn(
                    "flex-1 transition-all duration-300",
                    sidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link href="/seller/dashboard" className="hover:text-sidebar-primary transition-colors font-medium">
                            Seller Portal
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-bold">Dashboard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/seller/dashboard/products/create')}
                            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground gap-2 rounded-full shadow-lg hover:shadow-xl transition-all"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline font-bold">Add Product</span>
                        </Button>
                        <div className="w-px h-8 bg-slate-200" />
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-sidebar-primary hover:bg-sidebar-accent rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
