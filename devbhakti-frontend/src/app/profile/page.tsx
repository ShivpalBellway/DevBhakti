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
    Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, fetchProfile } from "@/api/authController";
import { BASE_URL } from "@/config/apiConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

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
    });
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await fetchProfile();
            if (response.success) {
                const u = response.data.user;
                setUser(u);
                setFormData({
                    name: u.name || "",
                    email: u.email || "",
                });
                if (u.profileImage) {
                    const imgUrl = u.profileImage.startsWith('http')
                        ? u.profileImage
                        : `${BASE_URL.replace('/api', '')}${u.profileImage}`;
                    setProfilePreview(imgUrl);
                }
                // Also update localStorage to keep it fresh
                localStorage.setItem("user", JSON.stringify(u));
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            } else {
                router.push("/auth?mode=login");
            }
        } finally {
            setIsLoading(false);
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
        localStorage.removeItem("user");
        localStorage.removeItem("token");
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
                                                className="absolute bottom-1 right-1 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-orange-700 transition-transform hover:scale-110 active:scale-90 z-20"
                                            >
                                                <Camera className="w-5 h-5" />
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        </>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
                                    <Phone className="w-3.5 h-3.5" />
                                    {user.phone}
                                    {user.isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />}
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-50">
                                    <div className="text-center p-3 bg-orange-50/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Rituals</p>
                                        <p className="text-xl font-bold text-primary">12</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sacred Items</p>
                                        <p className="text-xl font-bold text-primary">05</p>
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
                                            </div>

                                            {/* Tabs / Features Area */}
                                            <div className="pt-6">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Calendar className="w-5 h-5 text-orange-600" />
                                                    <h4 className="font-bold text-lg text-slate-800">Recent Pilgrimage Activity</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-orange-50/30 transition-colors group cursor-pointer">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center border border-slate-100">
                                                                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-700">Sacred Item Order #{1034 + i}</p>
                                                                    <p className="text-xs text-slate-400">Ordered on 1{i} Oct, 2025</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                                                                Delivered
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button variant="ghost" className="w-full mt-4 text-primary font-bold group">
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
                                                <h2 className="text-2xl font-bold text-slate-900">Update Wisdom</h2>
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
        </div>
    );
};

export default ProfilePage;
