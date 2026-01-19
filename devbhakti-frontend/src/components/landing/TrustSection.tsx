"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShieldCheck, Receipt, FileText, BellRing, CheckCircle2 } from "lucide-react";
import templeIcon from "@/assets/icons/temple-icon.png";
import donateIcon from "@/assets/icons/donate.png";
import diyaIcon from "@/assets/icons/diya.png";

const trustPoints = [
    {
        icon: templeIcon,
        isImage: true,
        title: "Verified Temples",
        description: "Every temple on our platform undergoes a rigorous 5-step verification process to ensure authenticity.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        icon: donateIcon,
        isImage: true,
        title: "Secure Donations with Receipts",
        description: "All contributions are processed via secure gateways. Receive official 80G tax-exempt receipts instantly.",
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        icon: diyaIcon,
        isImage: true,
        title: "Clean Records of Poojas & Offerings",
        description: "Transparent tracking for every ritual. Get photo and video proof of your offerings directly from the temple.",
        color: "text-orange-600",
        bg: "bg-orange-50",
    },
    {
        icon: BellRing,
        title: "Instant Notifications from Temple Trusts",
        description: "Stay connected with direct updates from the temple management about festivals, aartis, and events.",
        color: "text-black",
        bg: "bg-purple-50",
    },
];

const TrustSection: React.FC = () => {
    return (
        <section id="trust" className="py-6 relative overflow-hidden bg-white">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#b45309 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left Side: Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
                                <CheckCircle2 size={14} />
                                Our Commitment
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 mb-6 leading-tight">
                                Built on <span className="text-gradient-sacred">Trust & Transparency</span>
                            </h2>
                            <p className="text-black text-lg mb-8 leading-relaxed max-w-xl">
                                Unlike other platforms, DevBhakti is built on the foundation of direct connection. We ensure every rupee you donate and every pooja you book is handled with the utmost sanctity and transparency.
                            </p>

                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-zinc-200 overflow-hidden shadow-sm">
                                            <img
                                                src={`https://i.pravatar.cc/150?u=devbhakti${i}`}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <span className="block font-bold text-zinc-900">10,000+ Devotees Trust Us</span>
                                    <span className="text-black">Join a community of faithful believers</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Trust Grid */}
                    <div className="lg:w-1/2 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {trustPoints.map((point, index) => (
                                <motion.div
                                    key={point.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="p-6 rounded-3xl bg-zinc-50/80 border border-zinc-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group"
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${point.bg} ${point.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm overflow-hidden`}>
                                        {(point as any).isImage ? (
                                            <Image src={point.icon as any} alt={point.title} width={24} height={24} className="w-6 h-6 object-contain" />
                                        ) : (
                                            (() => {
                                                const IconComponent = point.icon as any;
                                                return <IconComponent size={24} />;
                                            })()
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-orange-700 transition-colors">
                                        {point.title}
                                    </h3>
                                    <p className="text-black text-[15px] leading-relaxed">
                                        {point.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Verification Banner */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-r from-[#814D27] to-[#DAB15C] text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div>
                            <h4 className="text-2xl font-serif font-bold mb-2">100% Verified Presence</h4>
                            <p className="text-[#e9e0d0] max-w-lg">
                                We work directly with Temple Trusts and Administrators. No middle-agents, no hidden fees, just pure devotion.
                            </p>
                        </div>
                        <button className="px-8 py-4 bg-white text-zinc-900 rounded-full font-bold hover:bg-orange-50 transition-colors shadow-lg shadow-white/10 whitespace-nowrap">
                            Learn More about Security
                        </button>
                    </div>
                </motion.div> */}
            </div>
        </section>
    );
};

export default TrustSection;
