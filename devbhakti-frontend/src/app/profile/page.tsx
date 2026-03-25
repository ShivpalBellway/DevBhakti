"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Mail,
    Phone,
    Camera,
    Save,
    ArrowLeft,
    ShoppingBag,
    Church,
    Heart,
    Bell,
    CheckCircle2,
    ShieldCheck,
    LogOut,
    ChevronRight,
    Loader2,
    Edit3,
    Calendar,
    Award,
    Download,
    X,
    Receipt,
    ExternalLink,
    MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, fetchProfile } from "@/api/authController";
import { fetchMyBookings, downloadBookingReceipt, fetchMyDonations, downloadDonationReceipt } from "@/api/userController";
import { BASE_URL } from "@/config/apiConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { fetchMyOrders } from "@/api/productOrderController";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { clearAllTokens } from "@/lib/auth-utils";

const ProfilePage = () => {
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        gothra: "",
        kuldevi: "",
        kuldevta: "",
        dob: "",
        anniversary: "",
        address: "",
        nativePlace: "",
    });
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isBookingsLoading, setIsBookingsLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [isDonationsLoading, setIsDonationsLoading] = useState(false);

    useEffect(() => {
        loadProfile();
        loadOrders();
        loadDonations();
    }, []);

    const loadOrders = async () => {
        try {
            const response = await fetchMyOrders();
            if (response.success) {
                setMyOrders(response.data);
            }
        } catch (error) {
            console.error("Failed to load orders", error);
        }
    };

    const loadProfile = async () => {
        try {
            const response = await fetchProfile();
            if (response.success) {
                const u = response.data.user;
                setUser(u);
                setFormData({
                    name: u.name || "",
                    email: u.email || "",
                    gothra: u.gothra || "",
                    kuldevi: u.kuldevi || "",
                    kuldevta: u.kuldevta || "",
                    dob: u.dob || "",
                    anniversary: u.anniversary || "",
                    address: u.address || "",
                    nativePlace: u.nativePlace || "",
                });
                if (u.profileImage) {
                    const imgUrl = u.profileImage.startsWith('http')
                        ? u.profileImage
                        : `${BASE_URL.replace('/api', '')}${u.profileImage}`;
                    setProfilePreview(imgUrl);
                }
                // Also update localStorage to keep it fresh
                localStorage.setItem("user", JSON.stringify(u));

                // Load bookings after profile
                loadBookings();
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                setUser(JSON.parse(savedUser));
                loadBookings();
            } else {
                router.push("/auth?mode=login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadBookings = async () => {
        setIsBookingsLoading(true);
        try {
            const res = await fetchMyBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setIsBookingsLoading(false);
        }
    };

    const loadDonations = async () => {
        setIsDonationsLoading(true);
        try {
            const res = await fetchMyDonations();
            if (res.success) {
                setDonations(res.data);
            }
        } catch (error) {
            console.error("Failed to load donations", error);
        } finally {
            setIsDonationsLoading(false);
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setProfilePreview(URL.createObjectURL(file));
            // Trigger auto-upload for image or wait for form?
            // To make it feel premium, we can auto-upload or just wait for "Save"
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("email", formData.email);
            fd.append("gothra", formData.gothra);
            fd.append("kuldevi", formData.kuldevi);
            fd.append("kuldevta", formData.kuldevta);
            fd.append("dob", formData.dob);
            fd.append("anniversary", formData.anniversary);
            fd.append("address", formData.address);
            fd.append("nativePlace", formData.nativePlace);
            if (selectedFile) {
                fd.append("profileImage", selectedFile);
            }

            const response = await updateProfile(fd);

            if (response.success) {
                localStorage.setItem("user", JSON.stringify(response.data.user));
                setUser(response.data.user);
                setIsEditMode(false);
                toast({
                    title: "Profile Updated",
                    description: "Your sacred profile has been updated successfully.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        clearAllTokens();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFCF6]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-slate-500 font-serif italic">Loading your sacred space...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FDFCF6]">
            <Navbar />

            <main className="pt-28 pb-20 container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-2"
                            >
                                <span className="w-8 h-[2px] bg-primary rounded-full"></span>
                                User Sanctuary
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-serif font-bold text-slate-900"
                            >
                                {isEditMode ? "Edit Profile" : "My Profile"}
                            </motion.h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {!isEditMode ? (
                                <Button
                                    onClick={() => setIsEditMode(true)}
                                    className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit Details
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditMode(false)}
                                    className="rounded-full text-slate-500 hover:bg-slate-100"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to View
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="rounded-full border-red-100 text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Profile Overview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-4 space-y-6"
                        >
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-orange-100/50 flex flex-col items-center text-center">
                                <div className="relative mb-6 group">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-orange-50 bg-orange-50 overflow-hidden shadow-inner relative">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-400">
                                                <User className="w-16 h-16" />
                                            </div>
                                        )}
                                    </div>
                                    {isEditMode && (
                                        <>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-orange-700 transition-transform hover:scale-110 active:scale-90 z-20"
                                                title="Recommended: 500x500 px"
                                            >
                                                <Camera className="w-5 h-5" />
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                            <p className="text-[10px] text-slate-400 mt-2font-bold uppercase tracking-widest">Recommended: 500x500 px</p>
                                        </>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
                                    <Phone className="w-3.5 h-3.5" />
                                    {user.phone}
                                    {user.isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />}
                                </div>

                                {user.address && (
                                    <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] mb-6 px-4 italic leading-tight">
                                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                                        <span className="line-clamp-2">{user.address}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-50">
                                    <div className="text-center p-3 bg-orange-50/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Rituals</p>
                                        <p className="text-xl font-bold text-primary">{bookings.length}</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sacred Items</p>
                                        <p className="text-xl font-bold text-primary">{myOrders.length.toString().padStart(2, '0')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Badge */}
                            <div className="bg-gradient-to-br from-[#88542B] to-[#794A05] rounded-[2rem] p-6 text-white shadow-xl">
                                <Award className="w-8 h-8 opacity-50 mb-4" />
                                <h4 className="font-bold text-lg mb-1">Blessed Devotee</h4>
                                <p className="text-white/70 text-sm mb-4">You have been part of DevBhakti family since {new Date(user.createdAt).toLocaleDateString()}.</p>
                                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-medium">
                                    <ShieldCheck className="w-3 h-3" />
                                    Verified Soul
                                </div>
                            </div>
                        </motion.div>

                        {/* RIGHT COLUMN: Details / Edit */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-8"
                        >
                            <AnimatePresence mode="wait">
                                {!isEditMode ? (
                                    <motion.div
                                        key="view"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-primary/5 border border-orange-100/50"
                                    >
                                        <div className="space-y-10">
                                            {/* Info Rows */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</p>
                                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <User className="w-5 h-5 text-primary" />
                                                        <span className="text-lg font-bold text-slate-700">{user.name}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</p>
                                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <Phone className="w-5 h-5 text-primary" />
                                                        <span className="text-lg font-bold text-slate-700">{user.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Connection</p>
                                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <Mail className="w-5 h-5 text-primary" />
                                                        <span className="text-lg font-bold text-slate-700">{user.email || "No email linked"}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Address</p>
                                                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                                        <span className="text-lg font-bold text-slate-700 leading-relaxed">{user.address || "Address not provided"}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Native Place</p>
                                                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                                        <span className="text-lg font-bold text-slate-700 leading-relaxed">{user.nativePlace || "Native place not provided"}</span>
                                                    </div>
                                                </div>

                                                {/* Spiritual Details */}
                                                {(user.gothra || user.kuldevi || user.kuldevta || user.dob || user.anniversary || user.address) && (
                                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                                        {user.gothra && (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gothra</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{user.gothra}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {user.kuldevi && (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kuldevi</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{user.kuldevi}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {user.kuldevta && (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kuldevta</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{user.kuldevta}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {user.dob && (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{format(new Date(user.dob), "dd MMM, yyyy")}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {user.anniversary && (
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Anniversary</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{format(new Date(user.anniversary), "dd MMM, yyyy")}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {user.address && (
                                                            <div className="space-y-1 md:col-span-3">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Delivery Address</p>
                                                                <div className="p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
                                                                    <span className="font-bold text-slate-700">{user.address}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tabs / Features Area */}
                                            <div className="pt-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Church className="w-5 h-5 text-orange-600" />
                                                    <h4 className="font-bold text-lg text-slate-800">Your Booked Poojas</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {isBookingsLoading ? (
                                                        <div className="flex justify-center py-8">
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        </div>
                                                    ) : bookings.length > 0 ? (
                                                        bookings.slice(0, 5).map((booking: any) => (
                                                            <div
                                                                key={booking.id}
                                                                onClick={() => setSelectedBooking(booking)}
                                                                className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-[1.5rem] hover:bg-orange-50/30 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                                                            >
                                                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/50 group-hover:bg-white transition-colors">
                                                                        <Church className="w-7 h-7 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-bold text-slate-800">{booking.pooja?.name}</p>
                                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">#{booking.id.slice(-6)}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                            <span className="font-medium">{booking.temple?.name}</span>
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            Booked on {new Date(booking.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-50">
                                                                    <div className="text-right">
                                                                        <p className="text-xs text-slate-400 font-medium">{booking.packageName}</p>
                                                                        <p className="font-bold text-primary flex items-center justify-end text-sm">
                                                                            <ShoppingBag className="w-3 h-3 mr-1" />
                                                                            ₹{booking.packagePrice}
                                                                        </p>
                                                                    </div>
                                                                    <div className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full ${booking.status === 'BOOKED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                                                        }`}>
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        {booking.status}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                                <Church className="w-8 h-8 text-slate-300" />
                                                            </div>
                                                            <p className="text-slate-500 font-medium">No bookings found in your sanctuary yet.</p>
                                                            <Button variant="link" className="text-primary mt-2" asChild>
                                                                <Link href="/poojas">Explore Poojas</Link>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                {bookings.length > 5 && (
                                                    <Button variant="ghost" className="w-full mt-4 text-primary font-bold group rounded-2xl hover:bg-orange-50" asChild>
                                                        <Link href="/profile/bookings">
                                                            View All Bookings <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Donations Section */}
                                            {/* <div className="pt-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Heart className="w-5 h-5 text-orange-600" />
                                                    <h4 className="font-bold text-lg text-slate-800">Your Sacred Donations</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {isDonationsLoading ? (
                                                        <div className="flex justify-center py-8">
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                        </div>
                                                    ) : donations.length > 0 ? (
                                                        donations.map((donation: any) => (
                                                            <div
                                                                key={donation.id}
                                                                className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-[1.5rem] hover:bg-orange-50/30 transition-all group shadow-sm hover:shadow-md"
                                                            >
                                                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/50 group-hover:bg-white transition-colors">
                                                                        <Heart className="w-7 h-7 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-bold text-slate-800">Donation to {donation.temple?.name}</p>
                                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">#{donation.id.slice(-6)}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                            <span>{donation.temple?.location}</span>
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(donation.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-50">
                                                                    <div className="text-right">
                                                                        <p className="font-bold text-primary text-lg">
                                                                            ₹{donation.amount}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-primary hover:bg-primary/10 rounded-full"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const res = await downloadDonationReceipt(donation.id);
                                                                                if (res.success) {
                                                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                                                    const link = document.createElement('a');
                                                                                    link.href = url;
                                                                                    link.setAttribute('download', `Donation-Receipt-${donation.id.slice(-6)}.pdf`);
                                                                                    document.body.appendChild(link);
                                                                                    link.click();
                                                                                    link.remove();
                                                                                }
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Download className="w-5 h-5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                            <p className="text-slate-400 text-sm">No sacred donations yet.</p>
                                                            <Button variant="link" className="text-primary mt-2" asChild>
                                                                <Link href="/donation">Make a Donation</Link>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div> */}


                                            <div className="pt-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                                                    <h4 className="font-bold text-lg text-slate-800">Your Sacred Orders</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {myOrders.length === 0 ? (
                                                        <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                            <p className="text-slate-400 text-sm">No recent sacred orders</p>
                                                        </div>
                                                    ) : (
                                                        myOrders.slice(0, 3).map(order => (
                                                            <div key={order.id} onClick={() => router.push("/profile/orders")} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-orange-50/30 transition-colors group cursor-pointer">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center border border-slate-100">
                                                                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-700">Sacred Order #{order.id.slice(-6).toUpperCase()}</p>
                                                                        <p className="text-xs text-slate-400">Ordered on {format(new Date(order.createdAt), "dd MMM, yyyy")}</p>
                                                                    </div>
                                                                </div>
                                                                <div className={cn("flex items-center gap-2 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider",
                                                                    order.status === "DELIVERED" || order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                                                )}>
                                                                    {order.status}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <Button onClick={() => router.push("/profile/orders")} variant="ghost" className="w-full mt-4 text-primary font-bold group">
                                                    View All Activities <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="edit"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-primary/5 border border-orange-100/50"
                                    >
                                        <div className="flex items-center gap-3 mb-10">
                                            <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center">
                                                <Edit3 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">Update Profile</h2>
                                                <p className="text-slate-500 text-sm">Synchronize your official details.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleUpdate} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Spirit Name</Label>
                                                    <div className="relative group">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                                        <Input
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Sacred Phone (Constant)</Label>
                                                    <div className="relative opacity-60">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input value={user.phone} disabled className="h-14 pl-12 bg-slate-100 border-transparent rounded-2xl text-lg font-medium cursor-not-allowed" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5 md:col-span-2">
                                                    <Label className="text-slate-700 font-bold ml-1">Email Address</Label>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                                                        <Input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Optional Spiritual Details */}
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Gothra</Label>
                                                    <Input
                                                        value={formData.gothra}
                                                        onChange={(e) => setFormData({ ...formData, gothra: e.target.value })}
                                                        placeholder="e.g. Kashyap"
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Kuldevi</Label>
                                                    <Input
                                                        value={formData.kuldevi}
                                                        onChange={(e) => setFormData({ ...formData, kuldevi: e.target.value })}
                                                        placeholder="Enter Kuldevi"
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Kuldevta</Label>
                                                    <Input
                                                        value={formData.kuldevta}
                                                        onChange={(e) => setFormData({ ...formData, kuldevta: e.target.value })}
                                                        placeholder="Enter Kuldevta"
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Date of Birth</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.dob}
                                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="text-slate-700 font-bold ml-1">Anniversary</Label>
                                                    <Input
                                                        type="date"
                                                        value={formData.anniversary}
                                                        onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5 md:col-span-2">
                                                    <Label className="text-slate-700 font-bold ml-1">Delivery Address</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        placeholder="Enter your complete address"
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2.5 md:col-span-2">
                                                    <Label className="text-slate-700 font-bold ml-1">Native Place</Label>
                                                    <Input
                                                        type="text"
                                                        value={formData.nativePlace}
                                                        onChange={(e) => setFormData({ ...formData, nativePlace: e.target.value })}
                                                        placeholder="Enter your native place / home town"
                                                        className="h-14 px-6 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl text-lg font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={isUpdating}
                                                    className="h-14 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                                                >
                                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setIsEditMode(false)}
                                                    className="h-14 px-8 text-slate-500 font-bold"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Church className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold">Booking Details</h3>
                                        <p className="text-orange-100 text-sm opacity-90 uppercase tracking-widest font-medium">Sacred Receipt</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Booking Status Banner */}
                                <div className={`flex items-center justify-between p-4 rounded-2xl ${selectedBooking.status === 'BOOKED' ? 'bg-emerald-50 border border-emerald-100' : 'bg-orange-50 border border-orange-100'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <Receipt className={`w-5 h-5 ${selectedBooking.status === 'BOOKED' ? 'text-emerald-500' : 'text-orange-500'}`} />
                                        <span className="font-bold text-slate-700">Booking Status</span>
                                    </div>
                                    <Badge className={`rounded-full px-4 py-1 font-bold ${selectedBooking.status === 'BOOKED' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
                                        }`}>
                                        {selectedBooking.status}
                                    </Badge>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Poojary / Ritual</p>
                                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                {selectedBooking.pooja?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Holy Temple</p>
                                            <p className="text-slate-700 font-medium flex items-center gap-1.5">
                                                <Church className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedBooking.temple?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Schedule Date</p>
                                            <p className="text-slate-700 font-medium flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(selectedBooking.createdAt).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Devotee Name</p>
                                            <p className="text-slate-800 font-bold flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedBooking.devoteeName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact Phone</p>
                                            <p className="text-slate-700 font-medium">{selectedBooking.devoteePhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Booking Reference</p>
                                            <p className="text-sm font-mono text-primary font-bold">#{selectedBooking.id.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    {/* New details */}
                                    {(selectedBooking.gothra || selectedBooking.kuldevi || selectedBooking.kuldevta || selectedBooking.dob || selectedBooking.anniversary) && (
                                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4">
                                            {selectedBooking.gothra && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Gothra</p>
                                                    <p className="text-slate-700 font-medium">{selectedBooking.gothra}</p>
                                                </div>
                                            )}
                                            {selectedBooking.kuldevi && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kuldevi</p>
                                                    <p className="text-slate-700 font-medium">{selectedBooking.kuldevi}</p>
                                                </div>
                                            )}
                                            {selectedBooking.kuldevta && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kuldevta</p>
                                                    <p className="text-slate-700 font-medium">{selectedBooking.kuldevta}</p>
                                                </div>
                                            )}
                                            {selectedBooking.dob && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">DOB</p>
                                                    <p className="text-slate-700 font-medium">{format(new Date(selectedBooking.dob), "dd MMM, yyyy")}</p>
                                                </div>
                                            )}
                                            {selectedBooking.anniversary && (
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Anniversary</p>
                                                    <p className="text-slate-700 font-medium">{format(new Date(selectedBooking.anniversary), "dd MMM, yyyy")}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Amount Summary */}
                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selected Package</p>
                                        <p className="text-slate-700 font-bold">{selectedBooking.packageName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Offering</p>
                                        <p className="text-3xl font-serif font-bold text-primary">₹{selectedBooking.packagePrice}</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        onClick={async () => {
                                            if (!selectedBooking) return;
                                            try {
                                                const res = await downloadBookingReceipt(selectedBooking.id);
                                                if (res.success) {
                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `Receipt-${selectedBooking.id.slice(-6)}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                } else {
                                                    toast({
                                                        title: "Download Failed",
                                                        description: "Could not download receipt. Please try again.",
                                                        variant: "destructive"
                                                    });
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20">
                                        Download Receipt
                                    </Button>
                                    {/* <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold border-slate-200">
                                        Need Help?
                                    </Button> */}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ProfilePage;
