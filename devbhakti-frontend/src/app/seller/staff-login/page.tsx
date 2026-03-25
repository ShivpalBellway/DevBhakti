"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Store, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { staffLogin } from "@/api/sellerController";
import { clearAllTokens } from "@/lib/auth-utils";

export default function SellerStaffLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await staffLogin(form);

            if (response.success) {
                // Clear any distinct panel's old sessions to prevent conflict
                clearAllTokens();

                // Save staff-specific auth data
                localStorage.setItem("token", response.token);
                localStorage.setItem("staff_user", JSON.stringify(response.staff));
                // Also set general 'user' for some shared layout hooks if needed
                localStorage.setItem("user", JSON.stringify({ ...response.staff, isStaff: true }));

                router.push("/seller/dashboard");
            } else {
                setError(response.error || "Login failed. Please check your credentials.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10 px-6"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    {/* Top bar */}
                    <div className="h-3 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-600" />

                    <div className="p-8 md:p-12">
                        {/* Logo & Intro */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <motion.div
                                whileHover={{ rotate: 5, scale: 1.05 }}
                                className="mb-6 p-4 bg-primary-50 rounded-2xl border border-primary-100"
                            >
                                <ShieldCheck className="w-12 h-12 text-primary-600" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                                Seller Staff Login
                            </h1>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm">
                                Administrative access for authorized marketplace personnel.
                            </p>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl flex items-center gap-3 shadow-sm"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Official Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="officer@seller.com"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="h-14 pl-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 rounded-2xl shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Password</Label>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <Input
                                            id="password"
                                            type={showPass ? "text" : "password"}
                                            placeholder="········"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="h-14 pl-12 pr-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 rounded-2xl shadow-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Authenticating...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Enter Seller Panel
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-100 pt-8">
                            <button
                                onClick={() => router.push("/seller")}
                                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                                <Store className="w-4 h-4" />
                                Not Staff? Login as Shop Owner
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6 opacity-60">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Enterprise Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Monitoring</span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-400 text-xs">
                    &copy; 2026 DevBhakti. Seller Governance Module.
                </p>
            </motion.div>
        </div>
    );
}
