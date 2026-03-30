"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { RefreshCw, MapPin, Mail, UserCheck, AlertTriangle, Info, Package, Heart } from "lucide-react";

export default function ReturnsRefundPolicyPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const clauses = [
        {
            title: "1. Nature of Platform Services",
            content: "DevBhakti is a technology platform that facilitates:",
            points: [
                "Online pooja bookings",
                "Coordination of devotional services",
                "(Donation-related services — currently not activated on the platform)",
                "Sale of devotional and related products (where applicable)"
            ],
            extra: "DevBhakti does not directly perform temple services but enables bookings and transactions between users and temples/vendors."
        },
        {
            title: "2. Cancellation Policy",
            content: "All bookings and orders made on DevBhakti are final. Once a booking, order, or transaction is confirmed:",
            points: [
                "No cancellations are permitted",
                "This includes changes requested by users after payment"
            ],
            extra: "Users are advised to carefully review all details before completing a transaction."
        },
        {
            title: "3. Refund Policy",
            content: "DevBhakti maintains a strict no refund policy. Under this policy:",
            points: [
                "Payments completed for services and products are non-refundable"
            ],
            secondaryContent: "DevBhakti does not provide refunds for:",
            secondaryPoints: [
                "Change of mind",
                "Incorrect user details",
                "Personal conflicts or schedule changes",
                "Dissatisfaction with a service performed",
                "Failure to attend a scheduled service"
            ],
            highlight: true,
            icon: AlertTriangle
        },
        {
            title: "4. Limited Exception (Technical Failures Only)",
            content: "In exceptionally rare cases, DevBhakti may consider a refund solely for:",
            points: [
                "Duplicate payments caused by technical errors",
                "Technical failures where funds were not successfully settled"
            ],
            extra: "Such refund consideration is discretionary, subject to verification, and may involve coordination with the relevant temple/vendor. Platform service fees and payment gateway charges may not be refundable."
        },
        {
            title: "5. Donation Transactions",
            content: "Donation-related services are currently not activated on the platform. When activated in the future, donations will generally be considered voluntary contributions directly to temples, and refunds will not be permitted except in cases of documented technical payment failures.",
            icon: Heart
        },
        {
            title: "6. Shipping & Physical Goods (if applicable)",
            content: "For physical products sold on the platform, please also refer to the Shipping Policy linked separately on the site.",
            icon: Package
        },
        {
            title: "7. Legal Jurisdiction",
            content: "This policy is governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.",
            icon: MapPin
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
                            <RefreshCw className="w-12 h-12 text-primary" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2"
                    >
                        Returns & Refund Policy
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
                        This Returns & Refund Policy is issued in accordance with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020, and applies to users of DevBhakti (operated by <span className="font-bold text-foreground">Divinity Labs Private Limited</span>).
                    </motion.p>
                </div>
            </section>

            {/* Clauses Section */}
            <section className="py-20 container mx-auto px-4">
                <div className="max-w-4xl mx-auto space-y-8">
                    {clauses.map((clause, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className={`p-8 md:p-10 rounded-[2.5rem] border shadow-soft transition-all ${clause.highlight
                                    ? 'bg-primary/5 border-primary/20'
                                    : 'bg-white border-border hover:shadow-warm'
                                }`}
                        >
                            <h3 className={`text-2xl font-serif font-bold mb-4 flex items-center gap-3 ${clause.highlight ? 'text-primary' : 'text-foreground'}`}>
                                {clause.icon && <clause.icon className="w-6 h-6" />}
                                {clause.title}
                            </h3>

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
                                <>
                                    <p className="text-lg text-foreground/80 leading-relaxed mb-4 mt-6">{clause.secondaryContent}</p>
                                    {clause.secondaryPoints && (
                                        <ul className="space-y-2 mb-4">
                                            {clause.secondaryPoints.map((point, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-3 text-foreground/80">
                                                    <span className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}

                            {clause.extra && (
                                <p className="text-base text-muted-foreground italic border-l-4 border-secondary/30 pl-4 py-1 mt-4">
                                    {clause.extra}
                                </p>
                            )}
                        </motion.div>
                    ))}

                    {/* Section 8: Customer Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="p-8 md:p-10 rounded-[2.5rem] border shadow-soft bg-white border-border"
                    >
                        <h3 className="text-2xl font-serif font-bold mb-6 text-foreground flex items-center gap-3">
                            <Mail className="w-6 h-6 text-primary" />
                            8. Customer Support & Grievance Redressal
                        </h3>

                        <p className="text-lg text-foreground/80 leading-relaxed mb-4">For support or assistance, users may contact:</p>

                        <div className="bg-secondary/5 p-5 rounded-xl border border-border inline-block mb-6">
                            <span className="font-semibold text-foreground">Email: </span>
                            <a href="mailto:support@devbhakti.in" className="text-primary font-bold hover:underline">support@devbhakti.in</a>
                        </div>

                        <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                            In accordance with the Consumer Protection (E-Commerce) Rules, 2020, the details of the Grievance Officer are as follows:
                        </p>

                        <div className="bg-white p-6 rounded-2xl border border-border shadow-soft max-w-md mx-auto space-y-3">
                            <div className="flex justify-between items-center border-b border-border pb-3">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Name</span>
                                <span className="font-bold text-foreground">Siddharth Pednekar</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border pb-3">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Designation</span>
                                <span className="font-bold text-foreground">Grievance Officer</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Email</span>
                                <a href="mailto:grievance.officer@devbhakti.in" className="font-bold text-primary hover:underline">grievance.officer@devbhakti.in</a>
                            </div>
                        </div>

                        <p className="text-base text-muted-foreground italic border-l-4 border-secondary/30 pl-4 py-1 mt-6">
                            All grievances shall be acknowledged within 48 hours and resolved within 30 days from receipt.
                        </p>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}