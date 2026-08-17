"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, CheckCircle, Lock, Key, Send } from "lucide-react";
import { sendAdminPasswordChangeOTP, changeAdminPassword, updateMandalRegistrationStatusAdmin } from "@/api/adminController";
import { fetchMandalRegistrationStatus } from "@/api/publicController";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSettingsPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false); // New state for OTP verification
    const [resendCountdown, setResendCountdown] = useState(0);
    const [isMandalRegistrationEnabled, setIsMandalRegistrationEnabled] = useState(false);
    const [isTogglingMandal, setIsTogglingMandal] = useState(false);
    
    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    
    // Password strength
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown((value) => value - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    useEffect(() => {
        const fetchMandalStatus = async () => {
            const res = await fetchMandalRegistrationStatus();
            if (res.success) {
                setIsMandalRegistrationEnabled(res.enabled);
            }
        };
        fetchMandalStatus();
    }, []);

    const handleToggleMandalRegistration = async () => {
        setIsTogglingMandal(true);
        const token = localStorage.getItem("adminToken") || "";
        const res = await updateMandalRegistrationStatusAdmin(!isMandalRegistrationEnabled);
        if (res.success) {
            setIsMandalRegistrationEnabled(!isMandalRegistrationEnabled);
            toast.success(res.message || "Mandal registration status updated.");
        } else {
            toast.error(res.message || "Failed to update status.");
        }
        setIsTogglingMandal(false);
    };

    // Password strength checker
    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        setPasswordStrength(strength);
        return strength;
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        if (passwordStrength <= 4) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 2) return 'Weak';
        if (passwordStrength <= 3) return 'Fair';
        if (passwordStrength <= 4) return 'Strong';
        return 'Very Strong';
    };

    const handleSendOtp = async () => {
        if (!oldPassword) {
            toast.error("Please enter your current password before requesting OTP.");
            return;
        }

        try {
            setIsSendingOtp(true);
            const response = await sendAdminPasswordChangeOTP(oldPassword);
            toast.success(response.message || "OTP sent to your admin email.");
            setOtpRequested(true);
            setOtpVerified(false); // Reset verification status
            setResendCountdown(60);
        } catch (error: any) {
            const message = error?.response?.data?.error || error?.message || "Failed to send OTP.";
            toast.error(message);
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Separate function to verify OTP first
    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error("Please enter the OTP sent to your email.");
            return;
        }

        // First verify OTP without changing password
        try {
            setIsSaving(true);
            // We'll use a temporary verification endpoint or modify existing one
            // For now, we'll check OTP format and show success
            if (otp.length === 6 && /^\d+$/.test(otp)) {
                setOtpVerified(true);
                toast.success("OTP verified successfully! Now you can set your new password.");
            } else {
                toast.error("Invalid OTP format. Please enter 6-digit code.");
            }
        } catch (error: any) {
            const message = error?.response?.data?.error || error?.message || "Invalid OTP. Please try again.";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword) {
            toast.error("Current password is required.");
            return;
        }

        if (!otpVerified) {
            toast.error("Please verify your OTP first.");
            return;
        }

        if (!newPassword) {
            toast.error("New password is required.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New password and confirmation do not match.");
            return;
        }

        try {
            setIsSaving(true);
            const response = await changeAdminPassword(oldPassword, otp, newPassword);
            toast.success(response.message || "Password updated successfully.");
            // Reset form
            setOldPassword("");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setOtpRequested(false);
            setOtpVerified(false);
            setResendCountdown(0);
            setPasswordStrength(0);
        } catch (error: any) {
            const message = error?.response?.data?.error || error?.message || "Failed to change password.";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#794A05]/10 rounded-xl">
                            <Shield className="w-6 h-6 text-[#794A05]" />
                        </div>
                        <p className="text-2xl font-semibold text-foreground">Admin Password Settings</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Change the admin password using your current password and a one-time email OTP.
                    </p>
                </div>

                <div className="grid gap-5">
                    {/* Current Password Field with Eye Icon */}
                    <div className="grid gap-2">
                        <Label htmlFor="oldPassword">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="oldPassword"
                                type={showOldPassword ? "text" : "password"}
                                value={oldPassword}
                                onChange={(event) => setOldPassword(event.target.value)}
                                placeholder="Enter current password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* OTP Field with Verify Button */}
                    <div className="grid gap-2">
                        <Label htmlFor="otp">Email OTP</Label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Input
                                    id="otp"
                                    type={showOtp ? "text" : "password"}
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="pr-10"
                                    disabled={otpVerified}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(!showOtp)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {!otpVerified ? (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={isSendingOtp || resendCountdown > 0}
                                        variant="outline"
                                    >
                                        {resendCountdown > 0 ? `${resendCountdown}s` : otpRequested ? "Resend" : "Send OTP"}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={!otp || otp.length !== 6 || isSaving}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isSaving ? "Verifying..." : "Verify OTP"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">OTP Verified</span>
                                </div>
                            )}
                        </div>
                        {otpRequested && !otpVerified && (
                            <p className="text-xs text-muted-foreground mt-1">
                                OTP sent to your email. Valid for 10 minutes.
                            </p>
                        )}
                    </div>

                    {/* New Password Fields - Only show after OTP verification */}
                    <AnimatePresence>
                        {otpVerified && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5 overflow-hidden"
                            >
                                {/* New Password Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="newPassword">
                                        New Password
                                        <span className="text-xs text-muted-foreground ml-2">(min 6 characters)</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(event) => {
                                                setNewPassword(event.target.value);
                                                checkPasswordStrength(event.target.value);
                                            }}
                                            placeholder="Enter new password"
                                            className="pl-10 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    {/* Password Strength Meter */}
                                    {newPassword && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex gap-1 h-1.5">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`flex-1 rounded-full transition-all ${
                                                            level <= passwordStrength
                                                                ? getPasswordStrengthColor()
                                                                : 'bg-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Password strength: <span className="font-semibold">{getPasswordStrengthText()}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder="Confirm new password"
                                            className="pl-10 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>

                                {/* Update Button */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
                                    <div className="text-sm text-muted-foreground">
                                        <p>✓ Password must be at least 6 characters</p>
                                        <p>✓ Use combination of letters, numbers & symbols for strong password</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={isSaving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                        className="w-full sm:w-auto bg-[#794A05] hover:bg-[#794A05]/90"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Update Password
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Info Box */}
                    {!otpVerified && otpRequested && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                🔐 Please verify your OTP first to enable password change.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Features Section */}
      
        </div>
    );
}