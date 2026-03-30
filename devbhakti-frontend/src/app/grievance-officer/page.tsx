"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { UserCheck, Shield, FileText, Mail, Gavel, Scale, MapPin, Clock, AlertCircle } from "lucide-react";

export default function GrievanceOfficerPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const complaintCategories = [
        "Platform services",
        "Booking issues",
        "Privacy concerns",
        "Refund matters",
        "Any other platform-related grievances"
    ];

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="p-4 bg-primary/10 backdrop-blur-md rounded-2xl">
                            <Scale className="w-12 h-12 text-primary" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2"
                    >
                        Grievance Officer
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-bold text-primary mb-6 uppercase tracking-widest"
                    >
                        Effective Date: 7 February 2026
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                    >
                        In accordance with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.
                    </motion.p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24 container mx-auto px-4">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Designated Officer Card */}
                    <motion.div {...fadeIn} className="bg-white p-10 rounded-[3rem] border border-border shadow-warm text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
                            <UserCheck className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold mb-8 text-foreground">Designated Officer</h2>

                        <div className="grid gap-4 text-left max-w-lg mx-auto">
                            <div className="bg-secondary/5 p-6 rounded-2xl border border-border flex justify-between items-center text-left">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Name</span>
                                <span className="text-xl font-bold text-foreground">Siddharth Pednekar</span>
                            </div>
                            <div className="bg-secondary/5 p-6 rounded-2xl border border-border flex justify-between items-center text-left">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Designation</span>
                                <span className="text-lg font-bold text-foreground">Grievance Officer</span>
                            </div>
                            <div className="bg-secondary/5 p-6 rounded-2xl border border-border flex justify-between items-center text-left">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Company</span>
                                <span className="text-lg font-bold text-foreground">Divinity Labs Private Limited</span>
                            </div>
                            <div className="bg-secondary/5 p-6 rounded-2xl border border-border flex justify-between items-center text-left">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Platform</span>
                                <span className="text-lg font-bold text-foreground">DevBhakti</span>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 flex justify-between items-center text-left">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </span>
                                <a href="mailto:grievance.officer@devbhakti.in" className="text-lg font-bold text-primary hover:underline">
                                    grievance.officer@devbhakti.in
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Grievance Redressal Mechanism */}
                    <motion.div {...fadeIn} className="bg-card p-10 rounded-[3rem] border border-border/50">
                        <h3 className="text-2xl font-serif font-bold mb-6 text-primary flex items-center gap-3">
                            <Gavel className="w-7 h-7" />
                            Grievance Redressal Mechanism
                        </h3>

                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                            <p className="font-medium text-foreground">
                                Users may submit complaints regarding:
                            </p>

                            <ul className="space-y-3">
                                {complaintCategories.map((category, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-foreground">{category}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <div className="grid md:grid-cols-2 gap-4 pt-4">
                                <div className="bg-white p-6 rounded-2xl border border-border flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Acknowledgment</p>
                                        <p className="text-lg font-bold text-foreground">Within 48 Hours</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-border flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Resolution Time</p>
                                        <p className="text-lg font-bold text-foreground">Within 30 Days</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground pt-2">
                                All complaints shall be acknowledged within 48 hours and resolved within 30 days from receipt, as required under applicable law.
                            </p>
                        </div>
                    </motion.div>

                    {/* Jurisdiction Section */}
                    <motion.div {...fadeIn} className="bg-gradient-sacred text-white p-10 rounded-[3rem] shadow-glow">
                        <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                            <MapPin className="w-7 h-7" />
                            Jurisdiction
                        </h3>
                        <div className="space-y-4 text-lg leading-relaxed">
                            <p className="opacity-90">
                                All grievances shall be governed by the laws of India and subject to the exclusive jurisdiction of courts in <span className="font-bold">Mumbai, Maharashtra</span>.
                            </p>
                        </div>
                    </motion.div>

                    {/* Bottom Cards */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div {...fadeIn} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-2">Legal Compliance</h4>
                                <p className="text-muted-foreground">Ensuring all operations adhere to the latest regulatory frameworks.</p>
                            </div>
                        </motion.div>
                        <motion.div {...fadeIn} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-soft flex gap-6 items-start text-left">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground mb-2">Documentation</h4>
                                <p className="text-muted-foreground">Maintained records of all grievances and their resolutions.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}