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
    MapPin,
    Loader2,
    Search,
    Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { fetchDevoteeDetailMyTemple } from "@/api/templeAdminController";
import { format } from "date-fns";

export default function TempleDevoteeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [bookingSearch, setBookingSearch] = useState("");
    const [bookingStatus, setBookingStatus] = useState("all");
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatus, setOrderStatus] = useState("all");
    const [donationSearch, setDonationSearch] = useState("");

    useEffect(() => {
        const loadUserDetail = async () => {
            setLoading(true);
            try {
                const response = await fetchDevoteeDetailMyTemple(id as string);
                if (response.success) {
                    setUser(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch devotee detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) loadUserDetail();
    }, [id]);

    const filteredBookings = (user?.bookings || []).filter((booking: any) => {
        const matchesSearch =
            booking.pooja?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
            booking.temple?.name?.toLowerCase().includes(bookingSearch.toLowerCase());
        const matchesStatus = bookingStatus === "all" || booking.status === bookingStatus;
        return matchesSearch && matchesStatus;
    });

    const filteredOrders = (user?.orders || []).filter((order: any) => {
        const orderIdMatch = order.id.toLowerCase().includes(orderSearch.toLowerCase());
        const itemMatch = order.subOrders?.some((so: any) =>
            so.items?.some((item: any) =>
                item.product?.name?.toLowerCase().includes(orderSearch.toLowerCase())
            )
        );
        const matchesStatus = orderStatus === "all" || order.status === orderStatus;
        return (orderIdMatch || itemMatch) && matchesStatus;
    });

    const filteredDonations = (user?.donations || []).filter((donation: any) =>
        donation.temple?.name?.toLowerCase().includes(donationSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-serif text-center">
                    Fetching devotee records...
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed m-6">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-serif text-muted-foreground">Devotee not found.</p>
                <Button variant="outline" className="mt-6 rounded-full px-8" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-700">
            {/* Header */}
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
                            Devotee Profile
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none shadow-none font-bold">
                                TEMPLE VIEW
                            </Badge>
                            <span className="text-muted-foreground text-sm">Devotee's interaction with your temple</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Bookings", value: user.bookings?.length || 0, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Orders", value: user.orders?.length || 0, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Donations", value: user.donations?.length || 0, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
                    {
                        label: "Total Spent",
                        value: `₹${[...(user.bookings || []), ...(user.orders || []), ...(user.donations || [])]
                            .reduce((acc: number, curr: any) => acc + (curr.packagePrice || curr.totalAmount || curr.amount || 0), 0)
                            .toLocaleString()}`,
                        icon: MapPin,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50"
                    },
                    {
                        label: "Join Date",
                        value: user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "N/A",
                        icon: Calendar,
                        color: "text-purple-600",
                        bg: "bg-purple-50"
                    },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-card hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Personal Info Card */}
                <Card className="lg:col-span-4 border-none shadow-lg bg-white/80 backdrop-blur-md sticky top-6 h-fit overflow-hidden">
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
                            <CardTitle className="text-2xl font-serif font-bold text-slate-900">
                                {user.name || "Blessed Soul"}
                            </CardTitle>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-bold">
                                    {user.role}
                                </Badge>
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
                                    <p className="text-sm font-medium text-slate-700">
                                        {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "N/A"}
                                    </p>
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
                                        <p className="text-sm font-semibold text-slate-800">
                                            {user.kuldevta || "N/A"} / {user.kuldevi || "N/A"}
                                        </p>
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
                    </CardContent>
                </Card>

                {/* Right: Activity Tabs */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Tabs defaultValue="bookings" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <TabsList className="grid w-fit grid-cols-3 bg-slate-50/50">
                                <TabsTrigger value="bookings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">
                                    <History className="w-4 h-4 mr-2" />
                                    Bookings ({(user.bookings || []).length})
                                </TabsTrigger>
                                <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Orders ({(user.orders || []).length})
                                </TabsTrigger>
                                <TabsTrigger value="donations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold">
                                    <Heart className="w-4 h-4 mr-2" />
                                    Donations ({(user.donations || []).length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Bookings Tab */}
                        <TabsContent value="bookings" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by pooja or temple..."
                                        className="pl-10 h-11 border-slate-200 rounded-xl"
                                        value={bookingSearch}
                                        onChange={(e) => setBookingSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
                                    {["all", "BOOKED", "COMPLETED", "CANCELLED"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={bookingStatus === status ? "default" : "outline"}
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
                                            className="group overflow-hidden border-slate-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 rounded-3xl"
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                            <History className="w-7 h-7 text-primary" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                                {booking.pooja?.name || "Sacred Pooja"}
                                                            </h4>
                                                            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                {booking.temple?.name || "Your Temple"}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                                    {booking.bookingDate || (booking.createdAt ? format(new Date(booking.createdAt), "PPP") : "N/A")}
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

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by Order ID or Product..."
                                        className="pl-10 h-11 border-slate-200 rounded-xl"
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
                                    {["all", "PENDING", "COMPLETED", "CANCELLED"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={orderStatus === status ? "default" : "outline"}
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
                                    filteredOrders.map((order: any) => (
                                        <Card
                                            key={order.id}
                                            className="group overflow-hidden border-slate-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300 rounded-3xl"
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-center bg-slate-50/80 p-4 rounded-2xl">
                                                        <div className="space-y-1">
                                                            <h4 className="text-xs font-black text-slate-400 tracking-widest uppercase">
                                                                ORDER #{order.id.substring(0, 8)}
                                                            </h4>
                                                            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-bold">
                                                                <Calendar className="w-3.5 h-3.5 opacity-50 text-primary" />
                                                                {order.createdAt ? format(new Date(order.createdAt), "PPP") : "N/A"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-primary">₹{order.totalAmount}</p>
                                                            <Badge
                                                                variant="outline"
                                                                className={`rounded-full px-2.5 font-bold text-[9px] border-none ${order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                                                                    }`}
                                                            >
                                                                {order.status}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="px-2 space-y-3">
                                                        {order.subOrders?.map((so: any) =>
                                                            so.items?.map((item: any) => (
                                                                <div key={item.id} className="flex items-center justify-between group/item">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/item:border-primary/20 transition-all">
                                                                            <ShoppingBag className="w-5 h-5 text-slate-400 group-hover/item:text-primary transition-colors" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-700 leading-tight">{item.product?.name}</p>
                                                                            <p className="text-[11px] text-muted-foreground font-bold">
                                                                                Qty: {item.quantity} • {item.variantName}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-sm font-black text-slate-900 tracking-tight">
                                                                        ₹{item.price * item.quantity}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-serif italic text-lg">No orders found.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Donations Tab */}
                        <TabsContent value="donations" className="mt-0 focus-visible:outline-none">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by Temple Name..."
                                        className="pl-10 h-11 border-slate-200 rounded-xl"
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
                                                                {donation.temple?.name || "Your Temple"}
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
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
