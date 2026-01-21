"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Building2, Key, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP } from "@/api/authController";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface TempleLoginModalProps {
    onClose: () => void;
}

export default function TempleLoginModal({ onClose }: TempleLoginModalProps) {
    const router = useRouter();
    const { toast } = useToast();
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
            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            toast({
                title: "Welcome Back",
                description: "Login successful to Temple Panel",
            });
            onClose();
            router.push("/temples/dashboard");
        } catch (error: any) {
            setError(error.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-orange-100 overflow-hidden relative">
            {/* Design Elements */}
            <div className="h-2 bg-gradient-to-r from-[#7b4623] via-[#a65d2e] to-[#7b4623]" />

            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-20"
            >
                <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="p-8 md:p-10">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 p-3 bg-[#7b4623]/5 rounded-2xl border border-[#7b4623]/10">
                        <Building2 className="w-10 h-10 text-[#7b4623]" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900">Temple Portal</h2>
                    <p className="text-sm text-slate-500 mt-1">Verify your registered number to enter</p>
                </div>

                {/* Error Box */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3"
                        >
                            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showOtpInput ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-700 ml-1">Phone Number</Label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7b4623] transition-colors" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter registered mobile"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-12 pl-12 bg-slate-50 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]"
                        >
                            {loading ? "Requesting OTP..." : "Continue to Dashboard"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        {receivedOtp && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center mb-4">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Test Code</p>
                                <p className="text-xl font-black text-emerald-700 tracking-widest">{receivedOtp}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <Label htmlFor="otp" className="text-slate-700">Verification Code</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpInput(false)}
                                    className="text-xs text-[#7b4623] font-bold"
                                >
                                    Change Number
                                </button>
                            </div>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#7b4623] transition-colors" />
                                <Input
                                    id="otp"
                                    type="text"
                                    maxLength={6}
                                    placeholder="· · · · · ·"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="h-12 pl-12 bg-slate-50 border-slate-200 text-center tracking-[0.5em] font-bold text-lg rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]"
                        >
                            {loading ? "Verifying..." : "Verify & Login"}
                        </Button>
                    </form>
                )}

                <p className="mt-8 text-center text-sm text-slate-400">
                    New Temple Administrator? <a href="/temples/register" className="text-[#7b4623] font-bold underline">Register Temple</a>
                </p>
            </div>
        </div>
    );
}
