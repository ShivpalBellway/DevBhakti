"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Building2, Key, CheckCircle2, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/icons/Logo";
import { sendOTP, verifyOTP } from "@/api/authController";
import { useRouter } from "next/navigation";
import Image from "next/image";

const TempleAuthForm: React.FC = () => {
    const router = useRouter();
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [receivedOtp, setReceivedOtp] = useState(""); // For development
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const normalizedPhone = phone.replace(/\D/g, '');
        try {
            const response = await sendOTP({ phone: normalizedPhone, role: "INSTITUTION" });
            setShowOtpInput(true);
            if (response.data?.otp) {
                setReceivedOtp(response.data.otp);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const normalizedPhone = phone.replace(/\D/g, '');
        try {
            const response = await verifyOTP(normalizedPhone, otp, "INSTITUTION");

            // Access data from nested structure
            const { token, user } = response.data;

            if (user.role !== "INSTITUTION") {
                setError("This login is only for sacred temples. Devotees please use the main login.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            router.push("/temples/dashboard");
        } catch (error: any) {
            setError(error.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF6] relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pattern-sacred grayscale" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10 px-6"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-primary/10 overflow-hidden">
                    {/* Top bar with design */}
                    <div className="h-3 bg-gradient-to-r from-[#7b4623] via-[#a65d2e] to-[#7b4623]" />

                    <div className="p-8 md:p-12">
                        {/* Logo & Intro */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <motion.div
                                className="mb-6 p-4 bg-[#7b4623]/5 rounded-2xl shadow-inner border border-[#7b4623]/10"
                            >
                                <Landmark className="w-12 h-12 text-[#7b4623]" />
                            </motion.div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
                                Temple Admin Portal
                            </h1>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                Secure access for sacred temples and spiritual establishments
                            </p>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3"
                                >
                                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Section */}
                        {!showOtpInput ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-slate-700 font-medium ml-1">Registered Phone Number</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7b4623] transition-colors">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Enter your 10-digit mobile number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-lg tracking-wide"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 ml-1">
                                        We will send a one-time password to verify your identity.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-[#7b4623] to-[#a65d2e] hover:from-[#5d351a] hover:to-[#7b4623] text-white rounded-2xl text-lg font-bold shadow-lg shadow-[#7b4623]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Processeing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Send Secure OTP
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                {receivedOtp && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-4 bg-[#7b4623]/5 border border-[#7b4623]/10 rounded-2xl text-center"
                                    >
                                        <p className="text-xs font-semibold text-[#7b4623] uppercase tracking-widest mb-1">Development OTP</p>
                                        <p className="text-2xl font-bold text-[#7b4623] tracking-[0.5em]">{receivedOtp}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label htmlFor="otp" className="text-slate-700 font-medium">One-Time Password</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowOtpInput(false)}
                                            className="text-xs text-[#7b4623] font-bold hover:underline"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7b4623] transition-colors">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <Input
                                            id="otp"
                                            type="text"
                                            maxLength={6}
                                            placeholder="· · · · · ·"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-2xl text-center tracking-[0.5em] font-bold"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">
                                        OTP has been sent to <span className="text-slate-600 font-bold">{phone}</span>
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Verifying...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Verify & Enter Panel
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                </Button>

                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        className="text-sm text-slate-500 hover:text-[#7b4623] transition-colors"
                                    >
                                        Didn't receive the code? <span className="font-bold underline">Resend</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            New temple? <a href="/temples/register" className="text-[#7b4623] font-bold hover:underline">Register your temple</a>
                        </p>
                    </div>
                </div>

                {/* Secure Trust Badges */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                    <div className="flex items-center gap-2 grayscale brightness-50">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 grayscale brightness-50">
                        <Landmark className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Divine Compliance</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TempleAuthForm;
