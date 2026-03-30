"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Zap,
    Image as ImageIcon,
    MapPin,
    Mail,
    Phone,
    Package,
    TrendingUp,
    HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import Link from "next/link";

export default function RegisterSellerPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden min-h-[80vh] flex items-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1582560475093-ba66accbc424?q=80&w=2000&auto=format&fit=crop"
                        alt="Artisans and Crafts"
                        fill
                        className="object-cover opacity-20 brightness-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Badge className="mb-6 bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
                                Seller Partnerships
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight pb-2">
                                Reach Millions of <br />
                                <span className="text-primary italic text-gradient-sacred">Devout Customers</span>
                            </h1>
                            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                                Join India's premier spiritual marketplace. Empower your business by bringing authentic pooja essentials, idols, and sacred treasures to devotees worldwide.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="xl" className="rounded-full shadow-lg shadow-primary/20 group" asChild>
                                    <Link href="/register-seller/form">
                                        Start Selling Now
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="xl" className="rounded-full border-primary/20 hover:bg-primary/5">
                                    View Seller Guide
                                </Button>
                            </div>

                            <div className="mt-12 flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-background overflow-hidden relative bg-muted">
                                            <Image
                                                src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                                alt="Seller"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Join <span className="text-foreground font-bold">2,000+</span> authentic sellers
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative aspect-square lg:aspect-auto lg:h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl">
                                <Image
                                    src="https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?q=80&w=2000&auto=format&fit=crop"
                                    alt="Seller Interface"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl">
                                    <p className="text-white font-medium italic text-lg mb-2">
                                        "DevBhakti helped us reach customers in 15+ countries within our first month. The spiritual audience here is incredible."
                                    </p>
                                    <p className="text-white/80 text-sm font-bold uppercase tracking-widest">— Om Art & Crafts</p>
                                </div>
                            </div>

                            {/* Floating Card */}
                            <div className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-xl hidden lg:block border border-primary/5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">145%</div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Growth</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">Monthly revenue growth per seller</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why DevBhakti Section */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-serif font-bold mb-4">Growth through Devotion</h2>
                        <p className="text-muted-foreground">Everything you need to grow your spiritual business online in one powerful platform.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {[
                            {
                                icon: Zap,
                                title: "Quick Setup",
                                desc: "Launch your digital temple storefront in under 24 hours with our guided onboarding."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Secure Payments",
                                desc: "Guaranteed safe transactions with instant payouts and full financial transparency."
                            },
                            {
                                icon: Package,
                                title: "Sacred Logistics",
                                desc: "Optimized shipping partners ensuring your blessed items reach devotees safely."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-muted"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden relative">
                                <Image
                                    src="https://images.unsplash.com/photo-1618193077732-c51f4961b783?q=80&w=2000&auto=format&fit=crop"
                                    alt="Seller Journey"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl font-serif font-bold mb-10">Simple 3-Step Journey</h2>
                            <div className="space-y-12">
                                {[
                                    {
                                        step: "01",
                                        title: "Register & Verify",
                                        desc: "Sign up with your business details and undergo a quick verification process to ensure authenticity."
                                    },
                                    {
                                        step: "02",
                                        title: "List Your Treasures",
                                        desc: "Upload high-quality images and soulful descriptions of your spiritual products or pooja items."
                                    },
                                    {
                                        step: "03",
                                        title: "Connect & Sell",
                                        desc: "Go live! Manage orders, respond to inquiries, and grow your community of devoted followers."
                                    }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="text-5xl font-serif font-bold text-primary/10 group-hover:text-primary/100 transition-colors duration-500">{s.step}</div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{s.title}</h4>
                                            <p className="text-muted-foreground">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button size="xl" className="mt-12 rounded-full w-full sm:w-auto" asChild>
                                <Link href="/register-seller/form">Join the Community</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="bg-primary rounded-[3.5rem] p-8 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />
                        <div className="relative z-10 text-white">
                            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8">Ready to bring the divine <br /> to everyone?</h2>
                            <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto">
                                Start your seller journey today and be part of India's fastest growing spiritual ecosystem. No complex paperwork, just pure devotion.
                            </p>
                            <Button variant="secondary" size="xl" className="rounded-full px-12 h-16 text-lg font-bold group" asChild>
                                <Link href="/register-seller/form">
                                    Get Started
                                    <Zap className="ml-2 w-5 h-5 fill-current animate-pulse" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function Badge({ children, className, ...props }: any) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`} {...props}>
            {children}
        </span>
    );
}
