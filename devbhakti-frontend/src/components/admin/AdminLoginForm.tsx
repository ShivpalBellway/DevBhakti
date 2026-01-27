"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/icons/Logo";
import { loginAdmin } from "@/api/adminController";

const AdminLoginForm: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const data = await loginAdmin(formData);

            // Store token and user info simply in localStorage
            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("admin_user", JSON.stringify(data.user));

            // Set a cookie for middleware/legacy checks
            document.cookie = "admin_logged_in=true; path=/";

            router.push("/admin");
        } catch (err: any) {
            const message = err.response?.data?.error || "Invalid email or password. Please try again.";
            setError(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Logo size="lg" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Admin Portal
                        </h1>
                        <p className="text-slate-500">
                            Please sign in to access the management dashboard
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 h-12 border-slate-200 focus:border-primary focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button type="button" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter Your Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-primary focus:ring-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            Secure access for authorized personnel only.
                        </p>
                    </div>
                </div>

                {/* Back to Site */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/")}
                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        ← Back to main website
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginForm;
