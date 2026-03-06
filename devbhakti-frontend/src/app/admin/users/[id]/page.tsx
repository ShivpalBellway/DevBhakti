"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    User,
    ShoppingBag,
    History,
    Eye,
    Loader2,
    Search,
    Heart,
    Store,
    Building2,
    LayoutDashboard,
    TrendingUp,
    MapPin,
    Wallet,
    Package,
    Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { fetchUserDetailAdmin } from "@/api/adminController";
import { format } from "date-fns";
import { BASE_URL } from "@/config/apiConfig";

export default function DevoteeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Search and Filter States
    const [bookingSearch, setBookingSearch] = useState("");
    const [bookingStatus, setBookingStatus] = useState("all");
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatus, setOrderStatus] = useState("all");
    const [donationSearch, setDonationSearch] = useState("");

    useEffect(() => {
        const loadUserDetail = async () => {
            setLoading(true);
            try {
                const response = await fetchUserDetailAdmin(id as string);
                if (response.success) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch user detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) loadUserDetail();
    }, [id]);

    useEffect(() => {
        if (user?.name) {
            window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: user.name }));
        }
    }, [user]);



    // Filtering Logic
    const filteredBookings = (user?.bookings || []).filter((booking: any) => {
        const matchesSearch = booking.pooja?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
            booking.temple?.name?.toLowerCase().includes(bookingSearch.toLowerCase());
        const matchesStatus = bookingStatus === "all" || booking.status === bookingStatus;
        return matchesSearch && matchesStatus;
    });

    const filteredOrders = (user?.orders || []).filter((order: any) => {
        const orderIdMatch = order.id.toLowerCase().includes(orderSearch.toLowerCase());
        const itemMatch = order.subOrders?.some((so: any) =>
            so.items?.some((item: any) => item.product?.name?.toLowerCase().includes(orderSearch.toLowerCase()))
        );
        const matchesStatus = orderStatus === "all" || order.status === orderStatus;
        return (orderIdMatch || itemMatch) && matchesStatus;
    });

    const filteredDonations = (user?.donations || []).filter((donation: any) => {
        const matchesSearch = donation.temple?.name?.toLowerCase().includes(donationSearch.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-serif text-center">Expanding cosmic consciousness...<br />Fetching records.</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed m-6">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-serif text-muted-foreground">Soul not found in our records.</p>
                <Button variant="outline" className="mt-6 rounded-full px-8" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Ashram
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                            {user.role === 'SELLER' ? 'Seller Profile' :
                                user.role === 'INSTITUTION' ? 'Temple Admin Profile' :
                                    user.role === 'ADMIN' ? 'Staff Profile' : 'Devotee Profile'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none shadow-none font-bold">ADMIN VIEW</Badge>
                            <span className="text-muted-foreground text-sm">
                                {user.role === 'SELLER' ? 'Vendor management and sales overview' :
                                    user.role === 'INSTITUTION' ? 'Temple operations and pooja management' :
                                        'Spiritual and commercial journey'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                    ...(user.role === 'SELLER' ? [
                        { label: "Sales", value: (user.sellerProfile?.subOrders || []).length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Products", value: (user.sellerProfile?.products || []).length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Earnings", value: `₹${(user.sellerProfile?.subOrders || []).reduce((acc: any, curr: any) => acc + (curr.netEarning || 0), 0).toFixed(0)}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" }
                    ] : user.role === 'INSTITUTION' ? [
                        { label: "Bookings", value: user.bookings?.length || 0, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Pooja", value: (user.temple?.poojas || []).length, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
                        { label: "Donations", value: (user.temple?.donations || user.donations || []).length, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Earnings", value: `₹${(user.temple?.bookings || []).reduce((acc: any, curr: any) => acc + (curr.netEarning || 0), 0).toFixed(0)}`, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" }
                    ] : [
                        { label: "Bookings", value: user.bookings?.length || 0, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Orders", value: user.orders?.length || 0, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Donations", value: user.donations?.length || 0, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Spent", value: `₹${[...(user.bookings || []), ...(user.orders || []), ...(user.donations || [])].reduce((acc, curr) => acc + (curr.packagePrice || curr.totalAmount || curr.amount || 0), 0).toLocaleString()}`, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ]),
                    { label: "Join Date", value: user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "N/A", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                            <div className={`p-2.5 rounded-xl shrink-0 ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-lg sm:text-xl font-bold text-slate-900 truncate">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Personal Information */}
                <Card className="lg:col-span-4 border-none shadow-lg bg-white/80 backdrop-blur-md lg:sticky lg:top-6 h-fit overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent absolute top-0 left-0 right-0" />
                    <CardHeader className="flex flex-col items-center pb-6 relative pt-12">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="w-28 h-28 rounded-full bg-white p-1 relative">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover shadow-inner" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-100">
                                        <User className="w-12 h-12 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <CardTitle className="text-2xl font-serif font-bold text-slate-900">{user.name || "Blessed Soul"}</CardTitle>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-bold">
                                    {user.role}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Verified</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors">
                                    <Mail className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Email Address</p>
                                    <p className="text-sm font-medium text-slate-700 truncate">{user.email || "No email linked"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors">
                                    <Phone className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Contact Number</p>
                                    <p className="text-sm font-medium text-slate-700">{user.phone || "No phone linked"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors">
                                    <Calendar className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Joined On</p>
                                    <p className="text-sm font-medium text-slate-700">{user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {user.gothra && (
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Spiritual Lineage</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Gothra</p>
                                        <p className="text-sm font-semibold text-slate-800">{user.gothra}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Kuldevta / Kuldevi</p>
                                        <p className="text-sm font-semibold text-slate-800">{user.kuldevta || "N/A"} / {user.kuldevi || "N/A"}</p>
                                    </div>
                                    {user.dob && (
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {format(new Date(user.dob), "d MMMM yyyy")}
                                            </p>
                                        </div>
                                    )}
                                    {user.anniversary && (
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Anniversary</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {format(new Date(user.anniversary), "d MMMM yyyy")}
                                            </p>
                                        </div>
                                    )}
                                    {user.address && (
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Address</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {user.address}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {user.sellerProfile && (
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Store className="w-3.5 h-3.5" />
                                    Seller Information
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Shop Name</p>
                                        <p className="text-base font-bold text-slate-900">{user.sellerProfile.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{user.sellerProfile.location || "Online Seller"}</p>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm text-slate-500">Service Fee</span>
                                        <span className="text-sm font-bold text-slate-900">{user.sellerProfile.productCommissionRate}%</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm text-slate-500">Status</span>
                                        <Badge className={user.sellerProfile.isVerified ? "bg-emerald-500" : "bg-amber-500"}>
                                            {user.sellerProfile.isVerified ? "Verified" : "Pending Approval"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user.temple && (
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Temple Management
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Temple Linked</p>
                                        <p className="text-base font-bold text-slate-900">{user.temple.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{user.temple.location}</p>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm text-slate-500">Pooja Comm.</span>
                                        <span className="text-sm font-bold text-slate-900">{user.temple.poojaCommissionRate}%</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm text-slate-500">Product Comm.</span>
                                        <span className="text-sm font-bold text-slate-900">{user.temple.productCommissionRate}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Activity Tabs with Search & Filters */}
                <div className="lg:col-span-8 flex flex-col gap-6 w-full">
                    <Tabs defaultValue={user.role === 'SELLER' ? 'inventory' : 'bookings'} className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto premium-scrollbar">
                            <TabsList className="flex w-fit bg-slate-50/50 p-1">
                                {user.role !== 'SELLER' && (
                                    <TabsTrigger value="bookings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 font-bold whitespace-nowrap">
                                        <History className="w-4 h-4 mr-2" />
                                        Bookings ({(user.bookings || []).length})
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 font-bold whitespace-nowrap">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Orders ({(user.orders || []).length})
                                </TabsTrigger>
                                {(user.role === 'DEVOTEE' || user.role === 'INSTITUTION') && (
                                    <TabsTrigger value="donations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 font-bold whitespace-nowrap">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Donations ({(user.temple?.donations || user.donations || []).length})
                                    </TabsTrigger>
                                )}
                                {(user.role === 'SELLER' || user.role === 'INSTITUTION') && (
                                    <>
                                        <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 font-bold whitespace-nowrap">
                                            <Package className="w-4 h-4 mr-2" />
                                            Products ({(user.sellerProfile?.products || user.temple?.products || []).length})
                                        </TabsTrigger>
                                        <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 font-bold whitespace-nowrap">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Withdrawals ({(user.sellerProfile?.withdrawals || user.temple?.withdrawals || []).length})
                                        </TabsTrigger>
                                    </>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent value="bookings" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by pooja or temple..."
                                        className="pl-10 h-11 border-slate-200 focus:ring-primary rounded-xl"
                                        value={bookingSearch}
                                        onChange={(e) => setBookingSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
                                    {["all", "BOOKED", "COMPLETED", "CANCELLED"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={bookingStatus === status ? "sacred" : "outline"}
                                            size="sm"
                                            className="rounded-full h-11 px-5 capitalize font-bold"
                                            onClick={() => setBookingStatus(status)}
                                        >
                                            {status.toLowerCase()}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking: any) => (
                                        <Card
                                            key={booking.id}
                                            className="group overflow-hidden border-slate-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 rounded-3xl cursor-pointer"
                                            onClick={() => router.push(`/admin/pooja-bookings?id=${booking.id}`)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                            <History className="w-7 h-7 text-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{booking.pooja?.name || "Sacred Pooja"}</h4>
                                                            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                {booking.temple?.name || "N/A"}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                                    {booking.createdAt ? format(new Date(booking.createdAt), "PPP") : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                                        <p className="text-xl font-black text-primary">₹{booking.packagePrice}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-full px-3 py-1 font-black text-[10px] tracking-wide border-none ${booking.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                                                                booking.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                                                                    "bg-blue-50 text-blue-700"
                                                                }`}
                                                        >
                                                            {booking.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-serif italic text-lg">No matching bookings found.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by Order ID or Product..."
                                        className="pl-10 h-11 border-slate-200 focus:ring-primary rounded-xl"
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
                                    {["all", "PENDING", "COMPLETED", "CANCELLED"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={orderStatus === status ? "sacred" : "outline"}
                                            size="sm"
                                            className="rounded-full h-11 px-5 capitalize font-bold"
                                            onClick={() => setOrderStatus(status)}
                                        >
                                            {status.toLowerCase()}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order: any) => {
                                        const firstItem = order.subOrders?.[0]?.items?.[0];
                                        const productName = firstItem?.product?.name || `Order #${order.id.substring(0, 8)}`;
                                        const productImage = firstItem?.product?.image;
                                        const totalItems = (order.subOrders || []).reduce((acc: number, so: any) => acc + (so.items || []).length, 0);

                                        return (
                                            <Card
                                                key={order.id}
                                                className="group overflow-hidden border-slate-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 rounded-3xl cursor-pointer"
                                                onClick={() => router.push(`/admin/products/orders?id=${order.id}`)}
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                        <div className="flex gap-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors overflow-hidden">
                                                                {productImage ? (
                                                                    <img src={`${BASE_URL}${productImage}`} alt={productName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ShoppingBag className="w-7 h-7 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                                    {productName}
                                                                    {totalItems > 1 && <span className="text-xs text-muted-foreground ml-2 font-medium">(+{totalItems - 1} more items)</span>}
                                                                </h4>
                                                                <p className="text-xs font-black text-slate-400 tracking-widest uppercase">ORDER #{order.id.substring(0, 8)}</p>
                                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                                        {order.createdAt ? format(new Date(order.createdAt), "PPP") : "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                                            <p className="text-xl font-black text-primary">₹{order.totalAmount}</p>
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-full px-3 py-1 font-black text-[10px] tracking-wide border-none ${order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                                                                    order.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                                                                        "bg-blue-50 text-blue-700"
                                                                    }`}
                                                            >
                                                                {order.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-serif italic text-lg">No orders found.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="donations" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by Temple Name..."
                                        className="pl-10 h-11 border-slate-200 focus:ring-primary rounded-xl"
                                        value={donationSearch}
                                        onChange={(e) => setDonationSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredDonations.length > 0 ? (
                                    filteredDonations.map((donation: any) => (
                                        <Card
                                            key={donation.id}
                                            className="group overflow-hidden border-slate-100 hover:border-rose-500/30 hover:shadow-lg transition-all duration-300 rounded-3xl"
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                                                            <Heart className="w-7 h-7 text-rose-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                                                                Temple Donation
                                                            </h4>
                                                            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                {donation.temple?.name || "DevBhakti Platform"}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                                    {donation.createdAt ? format(new Date(donation.createdAt), "PPP") : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                                        <p className="text-xl font-black text-rose-600">₹{donation.amount}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full px-3 py-1 font-black text-[10px] tracking-wide border-none bg-emerald-50 text-emerald-700"
                                                        >
                                                            {donation.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-serif italic text-lg">No donations found.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="inventory" className="mt-0 focus-visible:outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(user.sellerProfile?.products || user.temple?.products || []).map((product: any) => (
                                    <Card key={product.id} className="rounded-2xl border-slate-100 hover:shadow-md transition-all">
                                        <CardContent className="p-4 flex gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                                {product.image && <img src={`${BASE_URL}${product.image}`} className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{product.name}</h4>
                                                <p className="text-xs text-slate-500">{product.category}</p>
                                                <Badge className="mt-2" variant={product.status === 'active' ? 'outline' : 'outline'}>{product.status}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="withdrawals" className="mt-0 focus-visible:outline-none">
                            <div className="space-y-4">
                                {(user.sellerProfile?.withdrawals || user.temple?.withdrawals || []).map((withdrawal: any) => (
                                    <Card key={withdrawal.id} className="rounded-2xl border-slate-100">
                                        <CardContent className="p-4 flex justify-between items-center">
                                            <div className="flex gap-4 items-center">
                                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-lg text-slate-900">₹{withdrawal.amount}</p>
                                                    <p className="text-xs text-slate-500">{format(new Date(withdrawal.createdAt), "PPP")}</p>
                                                </div>
                                            </div>
                                            <Badge variant={withdrawal.status === 'PAID' ? 'outline' : 'outline'}>{withdrawal.status}</Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
