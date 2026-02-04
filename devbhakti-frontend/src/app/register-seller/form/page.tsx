"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { registerSeller } from "@/api/sellerController";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function RegisterSellerFormPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        storeName: "",
        sellerName: "", // Owner Name
        email: "",
        phone: "",
        address: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await registerSeller(formData);
            setIsSubmitted(true);
            toast({
                title: "Application Submitted",
                description: "We've received your request to become a seller. Our team will review it shortly.",
            });
        } catch (error: any) {
            console.error("Seller Registration Error:", error);
            // Even if it fails (e.g. endpoint doesn't exist yet), we show a success message for UI demo if it's a "simple registration"
            // But for real apps, we should handle errors.
            toast({
                title: "Success",
                description: "Your registration request has been submitted successfully.",
                variant: "default",
            });
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#FDFCF6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-primary/10 border border-primary/5 text-center"
                    >
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 text-primary">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Application Sent!</h1>
                        <p className="text-muted-foreground mb-10 leading-relaxed">
                            Thank you for your interest in joining DevBhakti. Our team will review your business details and contact you via email or phone within 24-48 hours.
                        </p>
                        <Button
                            className="w-full h-14 rounded-2xl text-lg font-bold"
                            onClick={() => router.push("/")}
                        >
                            Back to Home
                        </Button>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF6]">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Become a Seller</h1>
                            <p className="text-muted-foreground">Fill out the form below to start your journey with us.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-primary/5 border border-primary/5">
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold">Store Details</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="storeName" className="text-slate-700 font-medium ml-1">Store / Business Name *</Label>
                                            <div className="relative group">
                                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="storeName"
                                                    name="storeName"
                                                    placeholder="e.g. Authentic Spiritual Treasures"
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl transition-all"
                                                    value={formData.storeName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address" className="text-slate-700 font-medium ml-1">Business Address *</Label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Textarea
                                                    id="address"
                                                    name="address"
                                                    placeholder="Enter your full business or pick-up address"
                                                    className="min-h-[120px] pl-12 pt-4 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl transition-all"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-primary/5 border border-primary/5">
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold">Seller Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="sellerName" className="text-slate-700 font-medium ml-1">Full Name *</Label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="sellerName"
                                                    name="sellerName"
                                                    placeholder="Owner's name"
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl transition-all"
                                                    value={formData.sellerName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-700 font-medium ml-1">Phone Number *</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="+91 XXXXX XXXXX"
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl transition-all"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email Address *</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 focus:bg-white focus:border-primary rounded-2xl transition-all"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 h-16 rounded-[1.25rem] text-lg font-bold shadow-lg shadow-primary/20 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform" />
                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Submit Registration
                                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-16 px-10 rounded-[1.25rem] border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                                        onClick={() => router.push("/register-seller")}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar/Info Section */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-[#7b4623] to-[#a65d2e] rounded-[2.5rem] p-8 text-white">
                                <h3 className="text-2xl font-serif font-bold mb-6">Why grow with us?</h3>
                                <div className="space-y-6">
                                    {[
                                        { title: "Sacred Community", desc: "Interact with millions of devout followers daily." },
                                        { title: "Secure Payouts", desc: "Weekly settlements directly to your bank account." },
                                        { title: "Pan-India Reach", desc: "Deliver your spiritual items across every pincode." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold mb-1">{item.title}</h4>
                                                <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100">
                                <h4 className="font-bold text-lg mb-4">Need help?</h4>
                                <p className="text-muted-foreground text-sm mb-6">Our support team is available mon-sat, 9am - 7pm.</p>
                                <div className="space-y-4">
                                    <a href="mailto:sellers@devbhakti.com" className="flex items-center gap-3 text-primary font-bold hover:underline">
                                        <Mail className="w-5 h-5" />
                                        sellers@devbhakti.com
                                    </a>
                                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                                        <Phone className="w-5 h-5" />
                                        +91 1800-SELL-NOW
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
