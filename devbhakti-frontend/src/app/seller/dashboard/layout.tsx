"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
    Users,
    ArrowDownToLine,
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
import { clearAllTokens } from "@/lib/auth-utils";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ShieldCheck } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const sellerSidebarGroups = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/seller/dashboard", permission: "dashboard.view" }
        ]
    },
    {
        title: "Inventory",
        items: [
            { label: "Product List", icon: Package, href: "/seller/dashboard/products", permission: "products.view" },
            { label: "Add Product", icon: PlusCircle, href: "/seller/dashboard/products/create", permission: "products.create" }
        ]
    },
    {
        title: "Orders",
        items: [
            { label: "All Orders", icon: ShoppingBag, href: "/seller/dashboard/orders", permission: "products.orders.view" },
            { label: "Pending", icon: Clock, href: "/seller/dashboard/orders?status=pending", permission: "products.orders.view" },
            { label: "Accepted", icon: CheckCircle, href: "/seller/dashboard/orders?status=accepted", permission: "products.orders.view" },
            { label: "Shipped", icon: Truck, href: "/seller/dashboard/orders?status=shipped", permission: "products.orders.view" },
            { label: "Delivered", icon: PackageCheck, href: "/seller/dashboard/orders?status=delivered", permission: "products.orders.view" },
            { label: "Cancelled", icon: XCircle, href: "/seller/dashboard/orders?status=cancelled", permission: "products.orders.view" },
            { label: "Customers", icon: Users, href: "/seller/dashboard/customers", permission: "products.orders.view" },
        ]
    },
    {
        title: "Team Management",
        items: [
            { label: "Staff Members", icon: Users, href: "/seller/dashboard/team/staff", permission: "team.staff.view" },
            { label: "Roles & Permissions", icon: ShieldCheck, href: "/seller/dashboard/team/roles", permission: "team.roles.manage" }
        ]
    },
    {
        title: "Finance",
        items: [
            { label: "Transaction Ledger", icon: IndianRupee, href: "/seller/dashboard/payments", permission: "finance.ledger.view" },
            { label: "Withdraw Request", icon: Wallet, href: "/seller/dashboard/payments/withdraw", permission: "finance.withdrawals.view" },
            { label: "Payout History", icon: CalendarCheck, href: "/seller/dashboard/payments/history", permission: "finance.withdrawals.view" },
            { label: "Bank Details", icon: Building2, href: "/seller/dashboard/payments/bank-details", permission: "seller.bank.manage" }
        ]
    },
    {
        title: "Profile",
        items: [
            { label: "Store Profile", icon: Store, href: "/seller/dashboard/profile", permission: "seller.profile.manage" }
        ]
    }
];

function SellerDashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasPermission } = useAdminAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);
    const [storeProfile, setStoreProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                setIsAuthenticated(true);
                setUser(JSON.parse(storedUser));

                try {
                    const response = await fetchSellerProfile();
                    if (response.success) {
                        setStoreProfile(response.data);
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
        clearAllTokens();
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
                <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border bg-sidebar-primary/5">
                    {sidebarOpen ? (
                        <Link href="/seller/dashboard" className="flex items-center gap-3 transition-all active:scale-95">
                            {storeProfile?.image ? (
                                <img
                                    src={`${BASE_URL}${storeProfile.image}`}
                                    className="w-10 h-10 shadow-lg rounded-xl object-cover bg-white"
                                    alt="Store Logo"
                                />
                            ) : (
                                <Logo size="sm" className="w-10 h-10 shadow-lg rounded-xl overflow-hidden bg-white" />
                            )}
                            <div className="flex flex-col">
                                <span className="text-sidebar-foreground font-serif font-black text-lg tracking-tight leading-none italic truncate max-w-[120px]">
                                    {storeProfile?.name || "DevBhakti"}
                                </span>
                                <span className="text-[10px] text-sidebar-primary font-bold uppercase tracking-widest mt-0.5">Seller Portal</span>
                            </div>
                        </Link>
                    ) : (
                        storeProfile?.image ? (
                            <img
                                src={`${BASE_URL}${storeProfile.image}`}
                                className="w-10 h-10 mx-auto shadow-md rounded-xl object-cover bg-white"
                                alt="Store Logo"
                            />
                        ) : (
                            <Logo size="sm" className="w-10 h-10 mx-auto shadow-md rounded-xl bg-white" />
                        )
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors absolute -right-3 top-7 bg-sidebar border border-sidebar-border shadow-md"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto premium-scrollbar">
                    {sellerSidebarGroups
                        .map(group => ({
                            ...group,
                            items: group.items.filter(item => !item.permission || hasPermission(item.permission))
                        }))
                        .filter(group => group.items.length > 0)
                        .map((group, groupIndex, filteredGroups) => (
                            <div key={group.title}>
                                {sidebarOpen && (
                                    <h3 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/40">
                                        {group.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const itemPathname = item.href.split('?')[0];
                                        const itemStatus = new URLSearchParams(item.href.split('?')[1] || "").get("status");
                                        const currentStatus = searchParams.get("status");

                                        const isActive = pathname === itemPathname && currentStatus === itemStatus;

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
                                {sidebarOpen && groupIndex < filteredGroups.length - 1 && (
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
                            "flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-sidebar-accent cursor-pointer",
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
                <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-sidebar-border flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        {storeProfile?.image ? (
                            <img
                                src={`${BASE_URL}${storeProfile.image}`}
                                className="w-8 h-8 sm:hidden shadow-sm rounded-lg object-cover bg-white"
                                alt="Store Logo"
                            />
                        ) : (
                            <Logo size="sm" className="w-8 h-8 sm:hidden shadow-sm rounded-lg bg-white" />
                        )}
                        <div className="flex items-center gap-2 capitalize overflow-x-auto whitespace-nowrap premium-scrollbar pb-1 w-full max-w-[calc(100vw-220px)] sm:max-w-none">
                            <Link href="/seller/dashboard" className="hover:text-sidebar-primary transition-colors font-bold text-slate-900 hidden sm:block">
                                {storeProfile?.name || "DevBhakti Seller"}
                            </Link>
                            {pathname === '/seller/dashboard' ? (
                                <>
                                    <ChevronRight className="w-4 h-4 hidden sm:block flex-shrink-0" />
                                    <span className="text-slate-500 font-medium">Dashboard</span>
                                </>
                            ) : (
                                pathname?.split('/').filter(Boolean).slice(2).map((path, index, array) => {
                                    const isLast = index === array.length - 1;
                                    const pathUrl = `/seller/dashboard/${array.slice(0, index + 1).join('/')}`;
                                    const title = path.replace(/-/g, ' ');

                                    return (
                                        <React.Fragment key={pathUrl}>
                                            <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-500" />
                                            {isLast ? (
                                                <span className="text-slate-500 font-medium">{title}</span>
                                            ) : (
                                                <Link href={pathUrl} className="hover:text-sidebar-primary transition-colors text-slate-900">
                                                    {title}
                                                </Link>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {hasPermission('products.create') && (
                            <Button
                                onClick={() => router.push('/seller/dashboard/products/create')}
                                className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground gap-2 rounded-full shadow-lg hover:shadow-xl transition-all"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span className="hidden sm:inline font-bold">Add Product</span>
                            </Button>
                        )}
                        <div className="w-px h-8 bg-slate-200" />
                        <NotificationBell userId={user?.id || user?.email || ''} userType="seller" />
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

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
            </div>
        }>
            <SellerDashboardContent>{children}</SellerDashboardContent>
        </Suspense>
    );
}

