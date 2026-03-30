"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Truck, Package, Clock, Globe, ShieldCheck, MapPin } from "lucide-react";

export default function ShippingPolicyPage() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const clauses = [
        {
            title: "1. Order Processing",
            content: "Orders for physical goods are processed once payment is confirmed. Processing time may vary based on:",
            points: [
                "Product type",
                "Vendor/temple dispatch timelines",
                "Seasonal or festival demand surges"
            ],
            extra: "All timelines provided at checkout are indicative and not guaranteed."
        },
        {
            title: "2. Delivery",
            content: "DevBhakti may facilitate shipping through third-party logistics partners, vendor dispatch, or temple dispatch. DevBhakti is not responsible for delays caused by:",
            points: [
                "Courier disruptions",
                "Incorrect address or contact details provided by the user",
                "Weather, natural events, or force majeure",
                "Regional logistical constraints"
            ]
        },
        {
            title: "3. Shipping Charges",
            content: "Shipping charges, if applicable, will be displayed at checkout and are based on:",
            points: [
                "Delivery location",
                "Weight and size of products",
                "Third-party logistics pricing"
            ],
            extra: "Additional shipping charges may apply for re-delivery in the event of failed delivery due to user errors."
        },
        {
            title: "4. No Returns & No Exchanges",
            content: "Due to the religious, customized, and perishable nature of devotional products (including prasad and ritual items):",
            points: [
                "All sales are final",
                "Products cannot be returned or exchanged once ordered"
            ],
            highlight: true
        },
        {
            title: "5. Damaged or Incorrect Items",
            content: "If a product is damaged in transit or is incorrect:",
            points: [
                "The user must notify us at support@devbhakti.in within 48 hours of delivery",
                "Users should provide photographic evidence",
                "DevBhakti will coordinate with the shipping partner/vendor for verification"
            ],
            extra: "Replacement or resolution is at DevBhakti’s discretion following verification."
        },
        {
            title: "6. Limitation of Liability",
            content: "DevBhakti’s liability for delivery issues is limited to:",
            points: [
                "The transaction value paid for the item"
            ],
            secondaryContent: "DevBhakti shall not be liable for:",
            secondaryPoints: [
                "Indirect or consequential loss",
                "Emotional or sentimental claims",
                "Any incidental expenses arising from delivery issues"
            ]
        },
        {
            title: "7. Force Majeure",
            content: "DevBhakti shall not be liable for delays or failures in delivery resulting from events or causes beyond reasonable control, including but not limited to:",
            points: [
                "Natural disasters",
                "Government restrictions or lockdowns",
                "Courier company strikes",
                "Pandemic or epidemic conditions",
                "Acts of God"
            ],
            extra: "In such cases, delivery timelines may be extended without liability."
        },
        {
            title: "8. Legal Jurisdiction",
            content: "This policy is governed by Indian law, and any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.",
            icon: MapPin
        }
    ];

    return (
        <main className="min-h-screen bg-background overflow-x-hidden">
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
                            <Truck className="w-12 h-12 text-primary" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2"
                    >
                        Shipping Policy
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
                        This Shipping Policy is issued in accordance with the Consumer Protection (E-Commerce) Rules, 2020 and applies to orders for physical goods on DevBhakti (operated by <span className="font-bold text-foreground">Divinity Labs Private Limited</span>).
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
                </div>
            </section>

            <Footer />
        </main>
    );
}