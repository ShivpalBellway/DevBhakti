"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Scale, CheckCircle2, AlertTriangle, Gavel, Globe, CreditCard, Info } from "lucide-react";

export default function TermsOfServicePage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const clauses = [
        {
            title: "1. Nature of Platform",
            content: "DevBhakti is a technology-enabled marketplace platform that facilitates interaction between devotees and temples and enables:",
            points: [
                "Online pooja and seva bookings",
                "Live darshan access",
                "Sale of devotional products (where applicable)",
                "(Donation-related services — currently not activated on the platform)"
            ],
            extra: "DevBhakti does not own, manage, operate, or control temples listed on the Platform. Temples and vendors are independent entities responsible for performing services and fulfilling obligations. DevBhakti does not guarantee religious, spiritual, or ritual outcomes."
        },
        {
            title: "2. Platform Content & Information Disclaimer",
            content: "The Platform aggregates and displays information provided by temples, vendors, and service providers. While the Company makes reasonable efforts to ensure accuracy, DevBhakti does not warrant or guarantee the completeness, reliability, or real-time accuracy of listings, pricing, schedules, ritual descriptions, or availability.",
            secondaryContent: "Certain information may:",
            points: [
                "Be subject to change without prior notice",
                "Be temporarily inaccurate due to updates",
                "Require confirmation from the concerned temple"
            ],
            extra: "Users should not rely solely on website content and should refer to booking confirmations or direct communication where necessary. Divinity Labs Private Limited shall not be liable for loss arising from reliance on provisional or updated information."
        },
        {
            title: "3. Eligibility",
            content: "Users must:",
            points: [
                "Be at least 18 years of age",
                "Provide accurate information",
                "Use the Platform lawfully"
            ],
            extra: "The Company reserves the right to suspend or terminate accounts for misuse or violations."
        },
        {
            title: "4. Bookings and Payments",
            content: "All bookings and purchases are subject to availability and confirmation. Payments are processed through third-party payment gateways. Divinity Labs Private Limited does not store full card details.",
            extra: "The Company is not responsible for failures caused by banking systems or gateway outages beyond reasonable control."
        },
        {
            title: "5. Cancellations and Refunds",
            content: "All transactions are governed by the Returns & Refund Policy available separately on the Platform.",
            extra: "By completing a transaction, you acknowledge that bookings are final and non-cancellable except as expressly provided in that policy."
        },
        {
            title: "6. Intellectual Property",
            content: "All content, branding, logos, design elements, and software are the property of Divinity Labs Private Limited. Unauthorized use is prohibited."
        },
        {
            title: "7. Limitation of Liability",
            content: "To the maximum extent permitted by law, the total liability of Divinity Labs Private Limited shall be limited to the transaction amount paid by the user. The Company shall not be liable for:",
            points: [
                "Indirect or consequential damages",
                "Emotional or religious dissatisfaction",
                "Conduct of independent temples",
                "Third-party service failures"
            ]
        },
        {
            title: "8. Force Majeure",
            content: "The Company shall not be liable for delays or failures caused by events beyond reasonable control, including natural disasters, government restrictions, temple closures, or technical outages."
        },
        {
            title: "9. Governing Law & Jurisdiction",
            content: "These Terms are governed by the laws of India. All disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra."
        }
    ];

    return (
        <main className="min-h-screen bg-background pattern-lotus">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex p-3 rounded-2xl bg-primary text-white mb-6 shadow-glow">
                            <Scale className="w-8 h-8" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 text-primary">
                            Terms of Service
                        </h1>
                        <p className="text-sm font-bold text-primary mb-6 uppercase tracking-widest">Effective Date: 7 February 2026</p>
                        <div className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto space-y-4">
                            <p>
                                These Terms of Service (“Terms”) govern your access to and use of the DevBhakti website, mobile applications, and related services (collectively, the “Platform”).
                            </p>
                            <p>
                                DevBhakti is owned and operated by <span className="font-bold">Divinity Labs Private Limited</span>, a company incorporated under the Companies Act, 2013, having its registered office in India (hereinafter referred to as “Company”, “DevBhakti”, “we”, “our”, or “us”).
                            </p>
                            <p>
                                By accessing or using the Platform, you agree to be bound by these Terms.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Terms List */}
            <section className="pb-24 container mx-auto px-4">
                <div className="max-w-4xl mx-auto space-y-8">
                    {clauses.map((clause, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="bg-white p-8 md:p-10 rounded-[2rem] border border-border shadow-soft hover:shadow-warm transition-all"
                        >
                            <h3 className="text-2xl font-serif font-bold mb-4 text-primary">{clause.title}</h3>
                            <p className="text-lg text-foreground/80 leading-relaxed mb-4">{clause.content}</p>

                            {clause.points && (
                                <ul className="space-y-2 mb-4">
                                    {clause.points.map((point, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-3 text-foreground/80">
                                            <span className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {clause.secondaryContent && (
                                <p className="text-lg text-foreground/80 leading-relaxed mb-4">{clause.secondaryContent}</p>
                            )}

                            {clause.extra && (
                                <p className="text-base text-muted-foreground italic border-l-4 border-secondary/30 pl-4 py-1">
                                    {clause.extra}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}