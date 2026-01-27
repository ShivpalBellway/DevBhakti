"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkle } from "lucide-react";
import {
    Clock,
    IndianRupee,
    ArrowRight,
    CheckCircle2,
    Info,
    MapPin,
    Star,
    HelpCircle,
    PlayCircle,
    Package,
    ChevronDown,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPublicPoojaById } from "@/api/publicController";
import { API_URL } from "@/config/apiConfig";

interface PoojaDetailClientProps {
    id: string;
}

const PoojaDetailClient = ({ id }: PoojaDetailClientProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [pooja, setPooja] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    useEffect(() => {
        const loadPooja = async () => {
            try {
                const data = await fetchPublicPoojaById(id);
                setPooja(data);
            } catch (error) {
                console.error("Failed to fetch pooja:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadPooja();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground font-medium">Loading divine details...</p>
            </div>
        );
    }

    if (!pooja) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold">Pooja not found</h1>
                <Button asChild className="mt-4">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/#poojas" className="hover:text-primary transition-colors">Poojas</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">{pooja.name}</span>
                    </div>

                    {/* Hero Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
                        {/* Left: Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <img
                                src={getFullImageUrl(pooja.image)}
                                alt={pooja.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                                <Badge className="bg-primary/90 text-white backdrop-blur-md px-3 py-1 text-sm">
                                    {pooja.category}
                                </Badge>
                            </div>
                        </motion.div>

                        {/* Right: Short Details */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col justify-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 ">
                                {pooja.name}
                            </h1>

                            <div className="mb-6 relative">
                                <p className={`text-md text-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                                    {pooja.about}
                                </p>
                                {pooja.about && pooja.about.length > 200 && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-primary text-sm font-semibold mt-1 hover:underline focus:outline-none"
                                    >
                                        {isExpanded ? "Read Less" : "Read More"}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="flex flex-col gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Key Highlights</h4>
                                    <ul className="text-sm text-foreground space-y-2">
                                        {(pooja.bullets || []).map((point: string, index: number) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <Sparkle className="w-3 h-3 text-primary" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex flex-col gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Ritual Info</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <span>{pooja.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span>{pooja.temple?.name || "Sacred Temple"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl border border-primary/20 shadow-xl">
                                <div>
                                    <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-bold">Starting from</div>
                                    <div className="flex items-center gap-1 text-3xl text-primary font-bold">
                                        <IndianRupee className="w-6 h-6" />
                                        {pooja.price}
                                    </div>
                                </div>
                                <Button size="lg" className="rounded-2xl px-8 text-lg font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                                    Book Now <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tabs Section */}
                    <div className="mt-12">
                        <Tabs defaultValue="about" className="w-full">
                            <div className="flex justify-center mb-10">
                                <TabsList className="h-auto bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-full border border-orange-100 text-black dark:border-zinc-800 gap-1 flex-wrap justify-center shadow-sm relative z-10">
                                    {[
                                        { id: "about", label: "About", icon: Info },
                                        { id: "benefits", label: "Benefits", icon: CheckCircle2 },
                                        { id: "process", label: "Process", icon: PlayCircle },
                                        { id: "packages", label: "Packages", icon: Package },
                                        { id: "faqs", label: "FAQs", icon: HelpCircle },
                                        { id: "temple", label: "Temple", icon: MapPin },
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 transition-all duration-300 flex items-center gap-2"
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-orange-100 dark:border-zinc-800 shadow-xl p-8 md:p-12 relative overflow-hidden min-h-[400px]">
                                {/* about tab */}
                                <TabsContent value="about" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-4xl mx-auto">
                                        <h3 className="text-3xl font-serif font-bold mb-6 text-primary">About the Ritual</h3>
                                        <div className="prose prose-orange dark:prose-invert max-w-none">
                                            <p className="text-lg text-foreground leading-relaxed whitespace-pre-line mb-8">
                                                {pooja.about || "Information about this puja will be updated soon."}
                                            </p>

                                            {pooja.description && Array.isArray(pooja.description) && pooja.description.length > 0 && (
                                                <div className="space-y-4">
                                                    {pooja.description.map((point: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                                                            <p className="text-lg text-foreground/80">{point}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Benefits tab */}
                                <TabsContent value="benefits" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-4xl mx-auto">
                                        <h3 className="text-3xl font-serif font-bold mb-8 text-center">Divine Blessings & Benefits</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {(pooja.benefits || []).map((benefit: string, idx: number) => (
                                                <div key={idx} className="p-6 rounded-2xl bg-orange-50/50 dark:bg-zinc-900/50 border border-orange-100 dark:border-zinc-800 flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Sparkle className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <p className="text-foreground font-medium">{benefit}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* process tab */}
                                <TabsContent value="process" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-4xl mx-auto">
                                        <h3 className="text-3xl font-serif font-bold mb-10 text-center">Ritual Process</h3>
                                        <div className="space-y-8">
                                            {(pooja.processSteps || []).map((step: any, idx: number) => (
                                                <div key={idx} className="flex gap-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-lg shadow-primary/20">
                                                            {idx + 1}
                                                        </div>
                                                        {idx !== (pooja.processSteps.length - 1) && (
                                                            <div className="w-0.5 h-full bg-primary/20 my-2" />
                                                        )}
                                                    </div>
                                                    <div className="pb-8">
                                                        <h4 className="text-xl font-bold text-foreground mb-2">{step.title}</h4>
                                                        <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Packages tab */}
                                <TabsContent value="packages" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-5xl mx-auto">
                                        <h3 className="text-3xl font-serif font-bold mb-10 text-center">Choose Your Package</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {(pooja.packages || []).map((pkg: any, idx: number) => (
                                                <div key={idx} className="p-8 rounded-[2.5rem] border border-orange-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all group">
                                                    <h4 className="text-2xl font-bold mb-3 font-serif">{pkg.name}</h4>
                                                    <p className="text-muted-foreground mb-8 text-lg">{pkg.description}</p>
                                                    <div className="flex items-end justify-between border-t border-orange-100 dark:border-zinc-800 pt-6">
                                                        <div>
                                                            <span className="text-xs text-muted-foreground block mb-1 uppercase font-bold">Contribution</span>
                                                            <div className="flex items-center gap-1 text-3xl font-bold text-primary">
                                                                <IndianRupee className="w-6 h-6" />
                                                                {pkg.price}
                                                            </div>
                                                        </div>
                                                        <Button className="rounded-full px-8 py-6 text-lg font-bold bg-primary hover:shadow-lg transition-all">
                                                            Select
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* FAQs tab */}
                                <TabsContent value="faqs" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-4xl mx-auto">
                                        <h3 className="text-3xl font-serif font-bold mb-10 text-center">Frequently Asked Questions</h3>
                                        <div className="space-y-4">
                                            {(pooja.faqs || []).map((faq: any, idx: number) => (
                                                <div key={idx} className="p-6 rounded-2xl border border-orange-100 dark:border-zinc-800 bg-orange-50/30 dark:bg-zinc-900/30">
                                                    <h4 className="text-lg font-bold text-foreground mb-3 flex items-start gap-3">
                                                        <HelpCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                                                        {faq.q}
                                                    </h4>
                                                    <p className="text-muted-foreground leading-relaxed pl-8">
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            ))}
                                            {(!pooja.faqs || pooja.faqs.length === 0) && (
                                                <div className="text-center py-12">
                                                    <p className="text-muted-foreground">No FAQs available for this pooja yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Temple tab */}
                                <TabsContent value="temple" className="relative z-10 mt-0 focus-visible:outline-none">
                                    <div className="max-w-4xl mx-auto">
                                        {pooja.temple ? (
                                            <div className="flex flex-col md:flex-row gap-8 items-center bg-orange-50/50 dark:bg-zinc-900/50 rounded-3xl p-8 border border-orange-100 dark:border-zinc-800">
                                                <div className="w-full md:w-1/3 aspect-video relative rounded-2xl overflow-hidden shadow-lg">
                                                    <img
                                                        src={getFullImageUrl(pooja.temple?.image)}
                                                        alt={pooja.temple?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Badge className="mb-2">{pooja.temple.category}</Badge>
                                                    <h3 className="text-2xl font-serif font-bold mb-2">{pooja.temple.name}</h3>
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span>{pooja.temple.location}</span>
                                                    </div>
                                                    <p className="text-foreground leading-relaxed line-clamp-3">
                                                        {pooja.temple.description}
                                                    </p>
                                                    <Button variant="outline" className="mt-6 gap-2 rounded-full" asChild>
                                                        <Link href={`/temples/${pooja.temple.id}`}>
                                                            Explore Temple <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-muted-foreground">Temple details will be available soon.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PoojaDetailClient;
