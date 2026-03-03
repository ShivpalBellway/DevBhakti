"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo2.png";
import { clearAllTokens } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function StaffLoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [error, setError] = useState("");
    const { toast } = useToast();

    const handleForgotPassword = async () => {
        if (!form.email) {
            setError("Please enter your email address first.");
            return;
        }

        setError("");
        setForgotLoading(true);

        try {
            const res = await fetch(`${API}/admin/auth/staff-forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send request");
                return;
            }

            toast({
                title: "Request Sent",
                description: data.message || "Password reset request sent to the administrator.",
            });
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API}/admin/team/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Invalid credentials");
                return;
            }

            // Clear any conflicting sessions
            clearAllTokens();

            // Store staff token and info
            localStorage.setItem("staff_token", data.token);
            localStorage.setItem("staff_user", JSON.stringify(data.staff));
            localStorage.setItem("staff_panel", "ADMIN");

            // Set cookie for layout auth check
            document.cookie = "admin_logged_in=true; path=/";

            // Redirect to admin dashboard
            router.push("/admin");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="relative h-12 w-36">
                            <Image src={logo} alt="DevBhakti" fill className="object-contain" priority />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Staff Login</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            DevBhakti Admin Panel — Staff Access Portal
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={forgotLoading || loading}
                                    className="text-xs text-primary hover:underline disabled:opacity-50"
                                >
                                    {forgotLoading ? "Sending..." : "Forgot password?"}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign In as Staff <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 pt-5 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            Are you the Super Admin?{" "}
                            <Link href="/admin/login" className="text-primary hover:underline font-medium">
                                DevBhakti Admin Login →
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Info box */}
                <div className="mt-4 p-4 bg-card/50 border border-border/50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground">
                        🔐 Your access is limited to permissions assigned by the admin.
                        Contact your admin if you need additional access.
                    </p>
                </div>
            </div>
        </div>
    );
}
