"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from "lucide-react";

export default function ContactClient() {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

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
                            <MessageSquare className="w-12 h-12 text-primary" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6 text-gradient-sacred pb-2"
                    >
                        Contact Us
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed space-y-4"
                    >
                        <p>
                            DevBhakti is owned and operated by:<br />
                            <span className="font-bold">Divinity Labs Private Limited</span><br />
                            Registered under the Companies Act, 2013 | India
                        </p>
                        <p>
                            We aim to respond to all queries within 48 hours.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Grid */}
            <section className="py-20 container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-card p-10 rounded-[2.5rem] border border-border/50 shadow-soft text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2 text-foreground">Customer Support</h3>
                        <p className="text-lg font-bold text-primary mb-4">support@devbhakti.in</p>
                        <p className="text-muted-foreground">For any queries, support requests, or general communication.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-card p-10 rounded-[2.5rem] border border-border/50 shadow-soft text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2 text-foreground">Grievance Officer</h3>
                        <p className="text-lg font-bold text-primary mb-2">Siddharth Pednekar</p>
                        <p className="text-sm font-medium text-muted-foreground mb-4">grievance.officer@devbhakti.in</p>
                        <p className="text-xs text-muted-foreground italic">As per Consumer Protection (E-Commerce) Rules, 2020</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-card p-10 rounded-[2.5rem] border border-border/50 shadow-soft text-center md:col-span-2 lg:col-span-1"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Send className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold mb-2 text-foreground">Partnerships</h3>
                        <p className="text-lg font-bold text-primary mb-4">sales@devbhakti.in</p>
                        <p className="text-muted-foreground">For partnership or temple onboarding queries.</p>
                    </motion.div>
                </div>  

                {/* Inquiry Form Placeholder */}
                <motion.div
                    {...fadeIn}
                    className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] border border-border shadow-elevated"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif font-bold mb-4 text-primary">Send us a Message</h2>
                        <p className="text-lg text-muted-foreground">Fill out the form below and we'll get back to you shortly.</p>
                    </div>

                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/70 ml-1">Full Name</label>
                                <input type="text" placeholder="Your Name" className="w-full px-6 py-4 rounded-2xl bg-secondary/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground/70 ml-1">Email Address</label>
                                <input type="email" placeholder="email@example.com" className="w-full px-6 py-4 rounded-2xl bg-secondary/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/70 ml-1">Subject</label>
                            <input type="text" placeholder="How can we help?" className="w-full px-6 py-4 rounded-2xl bg-secondary/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/70 ml-1">Message</label>
                            <textarea rows={5} placeholder="Your message..." className="w-full px-6 py-4 rounded-2xl bg-secondary/5 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea>
                        </div>
                        <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:shadow-glow transition-all flex items-center justify-center gap-3">
                            <Send className="w-5 h-5" />
                            Send Inquiry
                        </button>
                    </form>
                </motion.div>
            </section>

            <Footer />
        </main>
    );
}
