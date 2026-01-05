"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
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
    Package
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { poojas } from "@/data/poojas";

interface PoojaDetailClientProps {
    id: string;
}

const PoojaDetailClient = ({ id }: PoojaDetailClientProps) => {
    const poojaId = id;
    const pooja = poojas.find((p) => p.id === poojaId);

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
                    {/* Breadcrumb - Optional but good for UX */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/#poojas" className="hover:text-primary transition-colors">Poojas</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">{pooja.name}</span>
                    </div>

                    {/* Hero Section of Detail Page */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
                        {/* Left: Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800"
                        >
                            <Image
                                src={pooja.image}
                                alt={pooja.name}
                                fill
                                className="object-cover"
                                priority
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
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                                {pooja.name}
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                {pooja.description}
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Duration</div>
                                        <div className="font-bold">{pooja.duration}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Info className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Timing</div>
                                        <div className="font-bold">{pooja.time}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary to-orange-600 rounded-3xl text-white shadow-xl shadow-primary/20">
                                <div>
                                    <div className="text-white/80 text-sm mb-1 uppercase tracking-wider font-medium">Starting from</div>
                                    <div className="flex items-center gap-1 text-4xl font-bold">
                                        <IndianRupee className="w-8 h-8" />
                                        {pooja.price}
                                    </div>
                                </div>
                                <Button size="xl" variant="secondary" className="rounded-2xl px-8 h-14 text-lg font-bold hover:scale-105 transition-transform" asChild>
                                    <Link href={`#`}>
                                        Book Now <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-orange-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                        <Tabs defaultValue="about" className="w-full">
                            <div className="border-b border-orange-100 dark:border-zinc-800 px-6 md:px-12 pt-6">
                                <TabsList className="h-auto bg-transparent gap-4 md:gap-8 flex-wrap justify-start p-0">
                                    {[
                                        { id: "about", label: "About Puja", icon: Info },
                                        { id: "benefits", label: "Benefits", icon: CheckCircle2 },
                                        { id: "process", label: "Process", icon: PlayCircle },
                                        { id: "temple", label: "Temple Details", icon: MapPin },
                                        { id: "packages", label: "Packages", icon: Package },
                                        { id: "reviews", label: "Reviews", icon: Star },
                                        { id: "faqs", label: "FAQs", icon: HelpCircle },
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                            className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-4 text-base font-medium transition-all gap-2"
                                        >
                                            <tab.icon className="w-4 h-4 hidden sm:block" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <div className="p-8 md:p-12">
                                <TabsContent value="about" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-3xl">
                                        <h3 className="text-2xl font-serif font-bold mb-6">About {pooja.name}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                                            {pooja.about || "Information about this puja will be updated soon."}
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="benefits" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-3xl">
                                        <h3 className="text-2xl font-serif font-bold mb-6">Divine Benefits</h3>
                                        <ul className="space-y-4">
                                            {(pooja.benefits || []).map((benefit: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/50 dark:bg-zinc-900/50 border border-orange-100 dark:border-zinc-800">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-lg text-foreground">{benefit}</span>
                                                </li>
                                            ))}
                                            {(!pooja.benefits || pooja.benefits.length === 0) && (
                                                <p className="text-muted-foreground">General spiritual well-being and divine connection.</p>
                                            )}
                                        </ul>
                                    </div>
                                </TabsContent>

                                <TabsContent value="process" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-3xl">
                                        <h3 className="text-2xl font-serif font-bold mb-6">Ritual Process</h3>
                                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                                            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                                                {pooja.process || "The detailed process for this pooja will be shared upon booking or visit."}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="temple" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-3xl">
                                        <h3 className="text-2xl font-serif font-bold mb-6">Temple Details</h3>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="text-lg text-muted-foreground leading-relaxed">
                                                {pooja.templeDetails || "Details about the conducting temples will be provided post booking."}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="packages" className="mt-0 focus-visible:outline-none">
                                    <h3 className="text-2xl font-serif font-bold mb-8">Choose Your Package</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(pooja.packages || []).map((pkg: any, idx: number) => (
                                            <div key={idx} className="p-8 rounded-[2rem] border-2 border-orange-100 dark:border-zinc-800 hover:border-primary transition-colors bg-white dark:bg-zinc-900/50">
                                                <h4 className="text-xl font-bold mb-2">{pkg.name}</h4>
                                                <p className="text-muted-foreground mb-6">{pkg.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                                        <IndianRupee className="w-5 h-5" />
                                                        {pkg.price}
                                                    </div>
                                                    <Button variant="outline-sacred" size="sm">Select</Button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!pooja.packages || pooja.packages.length === 0) && (
                                            <p className="text-muted-foreground">Contact support for custom package inquiries.</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                                    <div className="py-8">
                                        <div className="text-center mb-12">
                                            <div className="flex justify-center mb-4">
                                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />)}
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">4.9/5 Rating</h3>
                                            <p className="text-muted-foreground">Based on verified devotee experiences.</p>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            {((pooja as any).reviews || []).map((review: any, idx: number) => (
                                                <div key={idx} className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                            {review.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{review.name}</div>
                                                            <div className="text-xs text-muted-foreground">{review.location}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex mb-2">
                                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
                                                    </div>
                                                    <p className="text-sm text-foreground/80 italic">"{review.message || "A divine experience."}"</p>
                                                </div>
                                            ))}
                                            {(!(pooja as any).reviews || (pooja as any).reviews.length === 0) && (
                                                <div className="col-span-2 text-center text-muted-foreground italic">
                                                    "A deeply spiritual experience that brought me immense peace."
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="faqs" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-3xl space-y-6">
                                        <h3 className="text-2xl font-serif font-bold mb-6">Frequently Asked Questions</h3>
                                        {(pooja.faqs || []).map((faq: any, idx: number) => (
                                            <div key={idx} className="border-b border-orange-50 dark:border-zinc-800 pb-6">
                                                <div className="font-bold text-lg mb-2 flex items-center gap-3">
                                                    <HelpCircle className="w-5 h-5 text-primary" />
                                                    {faq.q}
                                                </div>
                                                <p className="text-muted-foreground">{faq.a}</p>
                                            </div>
                                        ))}
                                        {(!pooja.faqs || pooja.faqs.length === 0) && (
                                            <p className="text-muted-foreground">Common questions will appear here.</p>
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
