"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Shield, Lock, Eye, Users, RefreshCw, FileText, Mail, MapPin } from "lucide-react";

export default function PrivacyPolicyPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const policies = [
        {
            icon: Eye,
            title: "1. Information Collected",
            content: "We may collect:",
            points: [
                "Name",
                "Email address",
                "Phone number",
                "Booking details",
                "Transaction details",
                "Communication records",
                "Device and usage data",
                "IP address"
            ]
        },
        {
            icon: FileText,
            title: "2. Use of Information",
            content: "Information is used to:",
            points: [
                "Process bookings",
                "Coordinate with temples/vendors",
                "Provide customer support",
                "Send confirmations and updates",
                "Improve platform services",
                "Comply with legal obligations"
            ],
            extra: "The Company does not sell personal data."
        },
        {
            icon: Lock,
            title: "3. Payment Processing",
            content: "Payments are processed by third-party gateways. Divinity Labs Private Limited does not store complete card details."
        },
        {
            icon: Users,
            title: "4. Data Sharing",
            content: "Information may be shared with:",
            points: [
                "Relevant temples/vendors",
                "Payment gateways",
                "Logistics partners",
                "Authorities when legally required"
            ]
        },
        {
            icon: Shield,
            title: "5. Data Security",
            content: "Reasonable security measures are implemented. However, no system is completely secure."
        },
        {
            icon: RefreshCw,
            title: "6. Data Retention",
            content: "Data is retained as long as necessary to:",
            points: [
                "Provide services",
                "Meet legal and regulatory requirements",
                "Resolve disputes"
            ]
        },
        {
            icon: Users,
            title: "7. User Rights",
            content: "Users may request correction or deletion of personal information (subject to legal retention requirements).",
            extra: "Requests may be sent to: support@devbhakti.in"
        }
    ];

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="p-4 bg-primary/10 backdrop-blur-md rounded-2xl">
                            <Shield className="w-12 h-12 text-primary" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2"
                    >
                        Privacy Policy
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
                        This Privacy Policy describes how personal information is collected, used, and protected on the DevBhakti Platform. DevBhakti is owned and operated by <span className="font-bold text-foreground">Divinity Labs Private Limited</span> ("Company", "we", "our", or "us").
                    </motion.p>
                </div>
            </section>

            {/* Policy Sections */}
            <section className="py-20 container mx-auto px-4">
                <div className="max-w-5xl mx-auto grid gap-8">
                    {policies.map((policy, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col md:flex-row gap-8 bg-white p-8 md:p-10 rounded-3xl border border-border shadow-soft hover:shadow-warm transition-all"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <policy.icon className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">{policy.title}</h3>
                                <p className="text-lg text-foreground/80 leading-relaxed mb-4">{policy.content}</p>
                                {policy.points && (
                                    <ul className="space-y-2 mb-4">
                                        {policy.points.map((point, pIdx) => (
                                            <li key={pIdx} className="flex items-start gap-3 text-foreground/80">
                                                <span className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {policy.extra && (
                                    <p className="text-lg font-medium text-primary italic">{policy.extra}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Section 8: Grievance Officer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row gap-8 bg-primary/5 p-8 md:p-10 rounded-3xl border border-primary/20 shadow-warm"
                    >
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-2xl font-serif font-bold mb-4 text-primary">8. Grievance Officer</h3>
                            <p className="text-lg text-foreground/80 leading-relaxed mb-4">For privacy-related grievances, contact:</p>
                            <div className="bg-white p-6 rounded-2xl border border-primary/20 space-y-2">
                                <p className="text-xl font-bold text-foreground">Siddharth Pednekar</p>
                                <p className="text-foreground/70">Grievance Officer</p>
                                <p className="text-foreground/70">Divinity Labs Private Limited</p>
                                <p className="text-primary font-bold">Email: grievance.officer@devbhakti.in</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 9: Governing Law */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row gap-8 bg-white p-8 md:p-10 rounded-3xl border border-border shadow-soft hover:shadow-warm transition-all"
                    >
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">9. Governing Law</h3>
                            <p className="text-lg text-foreground/80 leading-relaxed">This Privacy Policy is governed by Indian law.</p>
                            <p className="text-lg text-foreground/80 leading-relaxed mt-2"><span className="font-semibold">Jurisdiction:</span> Courts of Mumbai, Maharashtra.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}