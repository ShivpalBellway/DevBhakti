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

    const terms = [
        {
            icon: CheckCircle2,
            title: "Acceptance of Terms",
            content: "By accessing or using DevBhakti.in, you agree to be bound by these Terms of Service. If you do not agree, please refrain from using the platform."
        },
        {
            icon: Globe,
            title: "Nature of the Platform",
            content: "DevBhakti.in is a technology platform that facilitates interaction between devotees and temples. We do not own, manage, or control any temple listed on the platform."
        },
        {
            icon: Info,
            title: "Poojas and Sevas",
            content: "All rituals, schedules, and religious services are managed entirely by the respective temple. Availability, customs, and fulfilment depend on temple practices and circumstances.",
            extra: "DevBhakti.in does not guarantee the performance of any ritual but facilitates the booking and communication process."
        },
        {
            icon: CreditCard,
            title: "Payments",
            content: "Payments made through the platform are intended for the temple or its authorised entity. DevBhakti.in does not act as a trustee or custodian of religious offerings.",
            extra: "Any applicable platform or convenience charges are disclosed during the booking process."
        },
        {
            icon: AlertTriangle,
            title: "Limitations",
            content: "DevBhakti.in is not responsible for:",
            list: ["Changes in ritual dates or schedules", "Delays caused by temple-specific factors", "Events beyond reasonable control"]
        },
        {
            icon: Gavel,
            title: "Governing Law",
            content: "These terms are governed by applicable laws of India. Any disputes shall be subject to the jurisdiction of competent courts in Mumbai."
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
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-primary">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            The framework that ensures trust, clarity, and respect for all users of the DevBhakti platform.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Terms Grid */}
            <section className="pb-24 container mx-auto px-4">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
                    {terms.map((term, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white/70 backdrop-blur-md p-10 rounded-[2.5rem] border border-border/50 shadow-soft hover:shadow-elevated transition-all flex flex-col items-start text-left group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6 border border-secondary/20 shadow-sm group-hover:scale-110 transition-transform">
                                <term.icon className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">{term.title}</h3>
                            <p className="text-lg text-foreground/80 leading-relaxed mb-4">{term.content}</p>
                            {term.list && (
                                <ul className="space-y-3 mb-4 w-full">
                                    {term.list.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-primary/5 p-3 rounded-xl border border-primary/10">
                                            <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-secondary" />
                                            <span className="text-base text-foreground/90">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {term.extra && (
                                <div className="mt-auto pt-4 border-t border-border/50 w-full italic text-primary/70 font-medium">
                                    {term.extra}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Platform Information Disclaimer Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary opacity-[0.03]" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        {...fadeIn}
                        className="max-w-4xl mx-auto bg-gradient-to-br from-white to-secondary/5 p-12 rounded-[3rem] border border-secondary/30 shadow-warm text-center"
                    >
                        <h2 className="text-3xl font-serif font-bold mb-8 text-primary">Platform Information Disclaimer</h2>
                        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-left md:text-center">
                            <p>
                                Certain information displayed on DevBhakti.in is in the process of being updated and refined as the platform continues to evolve.
                            </p>
                            <p>
                                While we make reasonable efforts to ensure accuracy, some content may be provisional or subject to change. Users are advised not to rely solely on website content for final confirmation and to refer to booking confirmations or direct communication from the temple where applicable.
                            </p>
                        </div>
                        <div className="mt-10 pt-10 border-t border-border flex flex-col items-center">
                            <p className="text-foreground font-semibold mb-2">Have any questions?</p>
                            <a
                                href="mailto:admin@devbhakti.in"
                                className="text-2xl font-bold text-primary hover:text-secondary transition-colors underline underline-offset-8 decoration-secondary/30"
                            >
                                admin@devbhakti.in
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
