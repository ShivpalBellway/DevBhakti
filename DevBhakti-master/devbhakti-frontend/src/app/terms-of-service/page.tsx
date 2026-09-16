"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Scale, CheckCircle2, AlertTriangle, Gavel, Globe, CreditCard, Info, Trophy } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import termsImage from "@/assets/temple-meenakshi.jpg";

export default function TermsOfServicePage() {
    const { t, tRaw } = useLanguage();
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

    const localizedClauses = tRaw('terms.clauses') || [];
    const clausesMap = clauses.map((c, idx) => ({
        ...c,
        ...localizedClauses[idx]
    }));

    const contestTnc = tRaw('maza_ganesha_tnc');
    const contestTitle = contestTnc?.title || t('maza_ganesha_tnc.title') || "Maza Ganesha Photo Contest – Terms & Conditions";
    const contestClauses = contestTnc?.clauses || [];

    return (
        <main className="min-h-screen bg-background pattern-lotus" style={{ wordBreak: 'keep-all' }}>
            <Navbar />

            {/* Hero Header */}
            <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                    <Image
                        src={termsImage}
                        alt="Terms of Service"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 pt-28 pb-12 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="inline-flex p-3 rounded-2xl bg-primary/10 backdrop-blur-md text-primary mb-6 border border-primary/20">
                            <Scale className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-4 text-foreground leading-tight">
                            {t('terms.title')}
                        </h1>
                        <p className="text-sm font-bold text-primary mb-8 uppercase tracking-widest">{t('terms.effective_date')}</p>
                        
                        <div className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed space-y-4">
                            <p>
                                {t('terms.intro_p1')}
                            </p>
                            <p>
                                {t('terms.intro_p2')}
                            </p>
                            <p>
                                {t('terms.intro_p3')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Terms List */}
            <section className="pb-16 sm:pb-20 lg:pb-24 container mx-auto px-4 sm:px-6">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
                    {clausesMap.map((clause, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-[2rem] border border-border shadow-soft hover:shadow-warm transition-all overflow-hidden"
                        >
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-serif font-bold mb-3 sm:mb-4 text-primary break-words leading-tight hyphens-none">{clause.title}</h3>
                            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mb-3 sm:mb-4 break-words hyphens-none">{clause.content}</p>

                            {clause.points && (
                                <ul className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                                    {clause.points.map((point, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-2 sm:gap-3 text-foreground/80">
                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/60 mt-1.5 sm:mt-2 flex-shrink-0" />
                                            <span className="text-sm sm:text-base break-words leading-tight">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {(clause.secondaryContent || clause.secondary_content) && (
                                <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mb-3 sm:mb-4 break-words hyphens-none">{clause.secondaryContent || clause.secondary_content}</p>
                            )}

                            {clause.extra && (
                                <p className="text-sm sm:text-base text-muted-foreground italic border-l-2 sm:border-l-4 border-secondary/30 pl-3 sm:pl-4 py-1 break-words hyphens-none leading-tight">
                                    {clause.extra}
                                </p>
                            )}
                        </motion.div>
                    ))}

                    {/* Maza Ganesha Photo Contest Terms & Conditions */}
                    {contestClauses && contestClauses.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            id="maza-ganesha-tnc"
                            className="mt-12 sm:mt-16 bg-gradient-to-br from-[#fdf8f0] via-white to-amber-50/60 p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-[2rem] border-2 border-[#CA9E52]/40 shadow-warm overflow-hidden"
                        >
                            <div className="flex items-center gap-3.5 mb-6 sm:mb-8 pb-4 border-b border-amber-200/60">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#88542B] to-[#3d1a10] text-white shadow-md">
                                    <Trophy className="w-7 h-7 text-amber-300" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#88542B]">Special Contest Terms</span>
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-[#3d1a10] leading-tight">
                                        {contestTitle}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-4 sm:space-y-5">
                                {contestClauses.map((clause: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200/60 shadow-xs hover:border-[#CA9E52]/50 transition-all"
                                    >
                                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#88542B] mb-1.5">{clause.title}</h3>
                                        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{clause.content}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
