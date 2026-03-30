"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import { Building2, Calendar, ClipboardCheck, HeartHandshake, ShieldCheck, Sprout } from "lucide-react";
import aboutImage from "@/assets/temple-kashi.jpg";
import tirupatiImage from "@/assets/temple-tirupati.jpg";

export default function AboutClient() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    return (
        <main className="min-h-screen bg-background pattern-sacred">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2">
                            About DevBhakti
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Bridging the gap between ancient traditions and modern accessibility.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content Section 1: Who We Are */}
            <section className="py-20 bg-card/30 backdrop-blur-sm border-y border-border/50">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div {...fadeIn}>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-primary">Who We Are</h2>
                            <div className="space-y-4 text-lg text-foreground/80 leading-relaxed">
                                <p>
                                    DevBhakti.in is a digital platform created to help temples manage pooja and seva bookings in a simple, organised, and transparent manner. At the same time, it enables devotees to stay connected with their temples regardless of where they are located.
                                </p>
                                <p>
                                    Across India, many temples still rely on manual processes such as phone calls, registers, and in-person visits. This often leads to missed requests, lack of confirmation, and difficulty for devotees who live outside their hometowns.
                                </p>
                                <p>
                                    DevBhakti.in addresses this gap through technology that respects tradition while improving accessibility.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative aspect-video rounded-3xl overflow-hidden shadow-elevated border-8 border-white/50"
                        >
                            <div className="absolute inset-0 bg-gradient-sacred opacity-10" />

                            <Image
                                src={aboutImage}
                                alt="Sacred Tradition"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Content Section 2: What We Do */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <motion.div {...fadeIn} className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-primary">What We Do</h2>
                        <p className="text-lg text-muted-foreground">
                            We provide temples with digital tools and offer devotees a simple way to stay connected.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Building2, title: "List Poojas", text: "Create and showcase all poojas and sevas performed in the temple." },
                            { icon: Calendar, title: "Manage Schedules", text: "Real-time management of availability, time slots, and priest schedules." },
                            { icon: ClipboardCheck, title: "Accept Bookings", text: "Receive and manage online pooja booking requests effortlessly." },
                            { icon: HeartHandshake, title: "Receive Offerings", text: "Accept offerings through authorised and transparent digital channels." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-border/50 shadow-soft hover:shadow-warm transition-all hover:-translate-y-2 group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                                    <item.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div {...fadeIn} className="mt-16 text-center max-w-4xl mx-auto bg-primary/5 p-8 rounded-3xl border border-primary/10">
                        <p className="text-xl italic text-primary">
                            "For devotees, DevBhakti.in offers a simple way to discover temples, book rituals, and receive confirmations without repeated follow-ups or uncertainty."
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content Section 3: Our Role */}
            <section className="py-20 bg-gradient-to-br from-primary via-primary/95 to-accent text-white shadow-elevated">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8"
                        >
                            <ShieldCheck className="w-10 h-10" />
                        </motion.div>
                        <motion.h2 {...fadeIn} className="text-3xl md:text-5xl font-serif font-bold mb-8">Our Role</motion.h2>
                        <motion.div {...fadeIn} className="space-y-6 text-xl opacity-90 leading-relaxed font-light">
                            <p>
                                DevBhakti.in acts strictly as a facilitation platform. We do not perform rituals, influence temple customs, or alter religious practices in any form.
                            </p>
                            <p>
                                All poojas and sevas listed on the platform are performed by the respective temple priests as per established tradition. Offerings made through the platform are intended for the temple and are routed to authorised temple accounts.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Content Section 4: Our Purpose */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
                                <Sprout className="w-4 h-4" />
                                <span>Our Vision</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8 text-primary leading-tight">Our Purpose</h2>
                            <p className="text-xl text-foreground/80 leading-relaxed mb-8">
                                Our purpose is to support temples in their digital journey while preserving faith, trust, and transparency. DevBhakti.in is built with long-term sustainability in mind—for temples, devotees, and the ecosystem around them.
                            </p>
                            <div className="flex gap-4">
                                <div className="h-1 w-20 bg-gradient-sacred rounded-full" />
                                <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                <div className="h-1 w-4 bg-primary/10 rounded-full" />
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 relative"
                        >
                            <div className="absolute -inset-4 bg-gradient-sacred opacity-20 blur-3xl rounded-full" />
                            <Image
                                src={tirupatiImage}
                                alt="Devotion and Faith"
                                width={600}
                                height={400}
                                className="relative rounded-3xl shadow-warm border- border-white"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
