"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Shield, Lock, Eye, Users, RefreshCw, FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const sections = [
        {
            icon: Eye,
            title: "Information We Collect",
            content: "We collect only the information necessary to provide our services, which may include:",
            list: ["Name and contact details", "Booking and transaction information", "Communication related to support or confirmations"],
            extra: "We do not collect unnecessary or unrelated personal data."
        },
        {
            icon: FileText,
            title: "How We Use Information",
            content: "Information collected is used solely to:",
            list: ["Process pooja and seva bookings", "Share confirmations and updates", "Coordinate with the relevant temple", "Provide customer support"],
            extra: "We do not use personal information for unrelated marketing purposes without consent."
        },
        {
            icon: Users,
            title: "Sharing of Information",
            content: "User information is shared only with the concerned temple for the purpose of fulfilling the requested service.",
            extra: "We do not sell, rent, or trade personal data with third parties."
        },
        {
            icon: Lock,
            title: "Data Security",
            content: "We follow reasonable security practices to protect user data from unauthorised access, misuse, or disclosure.",
            extra: "While we strive to use commercially acceptable means to protect information, no digital system can guarantee absolute security."
        },
        {
            icon: RefreshCw,
            title: "Policy Updates",
            content: "This Privacy Policy may be updated from time to time.",
            extra: "Continued use of the platform indicates acceptance of the updated policy."
        }
    ];

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-16 bg-gradient-sacred text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10 pattern-lotus" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-glow">
                            <Shield className="w-12 h-12" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-4xl md:text-6xl font-serif font-bold mb-4"
                    >
                        Privacy Policy
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl opacity-90 max-w-2xl mx-auto font-light"
                    >
                        How we protect and manage your sacred trust and personal information.
                    </motion.p>
                </div>
            </section>

            {/* Introduction */}
            <section className="py-16 container mx-auto px-4">
                <motion.div
                    {...fadeIn}
                    className="max-w-4xl mx-auto bg-card p-8 md:p-12 rounded-[2rem] shadow-soft border border-border/50 text-center"
                >
                    <h2 className="text-3xl font-serif font-bold mb-6 text-primary">Introduction</h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        DevBhakti.in values the privacy of its users and is committed to protecting personal information shared on the platform. This Privacy Policy explains how information is collected, used, and safeguarded.
                    </p>
                    <p className="text-lg text-primary font-medium mt-6 italic">
                        "By using DevBhakti.in, you agree to the practices described in this policy."
                    </p>
                </motion.div>
            </section>

            {/* Policy Sections */}
            <section className="pb-24 container mx-auto px-4">
                <div className="max-w-5xl mx-auto grid gap-8">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col md:flex-row gap-8 bg-white p-8 md:p-10 rounded-3xl border border-border shadow-soft hover:shadow-warm transition-all group"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                    <section.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">{section.title}</h3>
                                <p className="text-lg text-foreground/80 leading-relaxed mb-4">{section.content}</p>
                                {section.list && (
                                    <ul className="space-y-3 mb-4">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-muted-foreground">
                                                <div className="w-2 h-2 rounded-full bg-secondary" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {section.extra && (
                                    <p className="text-lg font-medium text-primary/80 italic">{section.extra}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}
