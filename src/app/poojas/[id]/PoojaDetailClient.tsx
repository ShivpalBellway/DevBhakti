"use client";

import React from "react";
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
    ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { poojas, temples } from "@/data/poojas";

interface PoojaDetailClientProps {
    id: string;
}

const PoojaDetailClient = ({ id }: PoojaDetailClientProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
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
                            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 underline">
                                {pooja.name}
                            </h1>

                            <div className="mb-6 relative">
                                <p className={`text-md text-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                    {pooja.about}
                                </p>
                                {pooja.about && pooja.about.length > 300 && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-primary text-sm font-semibold mt-1 hover:underline focus:outline-none"
                                    >
                                        {isExpanded ? "Read Less" : "Read More"}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">
                                    <div>
                                        <ul className="text-sm text-black rounded px-2 list-disc list-inside space-y-2 drop-shadow-[0_3px_20px_rgba(8,8,8,0.5)]">
                                            {pooja.description.map((point, index) => (
                                                <li key={index} className="line-clamp-2 leading-relaxed pl-1 marker:text-primary">
                                                    ¤ {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                </div>
                                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800">

                                    <div>
                                        <ul className="text-sm text-black rounded px-2 list-disc list-inside space-y-2 drop-shadow-[0_3px_20px_rgba(8,8,8,0.5)]">
                                            {pooja.benefits.map((point, index) => (
                                                <li key={index} className="line-clamp-2 leading-relaxed pl-1 marker:text-green-600">
                                                    ¤ {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#ffb35070] to-gradient-sacred rounded-3xl text-white shadow-xl shadow-primary/20">
                                <div>
                                    <div className="text-pink-950 text-sm mb-1 uppercase tracking-wider font-medium">Starting from</div>
                                    <div className="flex items-center gap-1 text-xl text-primary font-bold">
                                        <IndianRupee className="w-6 h-8" />
                                        {pooja.price}
                                    </div>
                                </div>
                                <Button size="sm" variant="outline-sacred" className="rounded-2xl px-4  text-lg font-bold hover:scale-105 transition-transform" asChild>
                                    <Link href={`#`}>
                                        Book Now <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
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
                                        { id: "temple", label: "Temple", icon: MapPin },
                                        // { id: "packages", label: "Packages", icon: Package },
                                        { id: "reviews", label: "Reviews", icon: Star },
                                        { id: "faqs", label: "FAQs", icon: HelpCircle },
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
                                {/* Decorative background elements */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                                {/* about tab */}
                                <TabsContent value="about" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-6xl mx-auto">

                                        <div className="flex-1">
                                            <h3 className="text-3xl font-serif font-bold mb-6 text-gradient-sacred inline-block">About the Ritual</h3>
                                            <div className="prose prose-orange dark:prose-invert max-w-none">
                                                <p className="text-lg text-foreground leading-relaxed whitespace-pre-line">
                                                    {pooja.about || "Information about this puja will be updated soon."}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </TabsContent>

                                {/* Benefits tab */}
                                <TabsContent value="benefits" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-6xl mx-auto">
                                        <div className="text-center mb-10">
                                            <h3 className="text-3xl font-serif font-bold mb24 underline">Divine Blessings & Benefits</h3>
                                            <p className="text-foreground">Spiritual advantages of performing this sacred ritual</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {(pooja.benefits || []).map((benefit: string, idx: number) => {
                                                const separatorIndex = benefit.indexOf(":");
                                                const hasSeparator = separatorIndex !== -1;
                                                const title = hasSeparator ? benefit.substring(0, separatorIndex).trim() : benefit;
                                                const description = hasSeparator ? benefit.substring(separatorIndex + 1).trim() : "Experience spiritual upliftment and divine grace through this sacred ritual.";

                                                // Inline component for state management
                                                const BenefitCard = () => {
                                                    const [isReadMore, setIsReadMore] = React.useState(false);
                                                    return (
                                                        <div className="group p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-orange-100 dark:border-zinc-800 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col h-full">
                                                            <div className="flex items-start gap-4 ">
                                                                <div className="w-12 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                                    <Sparkle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-lg leading-tight text-foreground underline">{title}</h4>
                                                                </div>
                                                            </div>

                                                            <div className="pl-[4rem]">
                                                                <p className={`text-foreground text-sm leading-relaxed ${isReadMore ? '' : 'line-clamp-3'}`}>
                                                                    {description}
                                                                </p>
                                                                <button
                                                                    onClick={() => setIsReadMore(!isReadMore)}
                                                                    className="text-primary text-xs font-bold mt-2 uppercase tracking-wide hover:underline focus:outline-none flex items-center gap-1"
                                                                >
                                                                    {isReadMore ? "Read Less" : "Read More"}
                                                                    <ArrowRight className={`w-3 h-3 transition-transform ${isReadMore ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                };

                                                return <BenefitCard key={idx} />;
                                            })}
                                            {(!pooja.benefits || pooja.benefits.length === 0) && (
                                                <p className="text-muted-foreground col-span-full text-center">General spiritual well-being and divine connection.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* process tab */}
                                <TabsContent value="process" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-6xl mx-auto">
                                        <div className="text-center mb-10">
                                            <h3 className="text-3xl font-serif font-bold underline">Puja Process</h3>
                                            <p className="text-foreground mt-2">Simple steps from selection to completion</p>
                                        </div>

                                        {(() => {
                                            const rawSteps = (pooja as any).processSteps as
                                                | Array<{ title: string; description?: string }>
                                                | undefined;

                                            const derivedFromText: Array<{ title: string; description?: string }> = (() => {
                                                const text = (pooja.process || "").trim();
                                                if (!text) return [];

                                                const lines = text
                                                    .split("\n")
                                                    .map((l) => l.trim())
                                                    .filter(Boolean);

                                                if (lines.length >= 3) {
                                                    return lines.slice(0, 8).map((l) => {
                                                        const sepIdx = l.indexOf(":");
                                                        if (sepIdx !== -1) {
                                                            return {
                                                                title: l.slice(0, sepIdx).trim(),
                                                                description: l.slice(sepIdx + 1).trim(),
                                                            };
                                                        }
                                                        return { title: l };
                                                    });
                                                }

                                                const sentences = text
                                                    .split(/\.(\s+|$)/g)
                                                    .map((s) => (s || "").trim())
                                                    .filter((s) => s.length > 12);
                                                return sentences.slice(0, 8).map((s) => ({ title: s }));
                                            })();

                                            const steps =
                                                rawSteps && rawSteps.length > 0
                                                    ? rawSteps.map(s => ({
                                                        ...s,
                                                        title: s.title.replace(/^\d+\.\s*/, '').trim()
                                                    }))
                                                    : derivedFromText.length > 0
                                                        ? derivedFromText.map(s => ({
                                                            ...s,
                                                            title: s.title.replace(/^\d+\.\s*/, '').trim()
                                                        }))
                                                        : [];

                                            return (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {steps.length > 0 ? (
                                                        steps.map((step, idx) => {
                                                            return (
                                                                <div
                                                                    key={`${step.title}-${idx}`}
                                                                    className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-orange-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="w-9 h-9 rounded-full bg-primary text-white font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-base text-foreground leading-tight">
                                                                                {step.title}
                                                                            </h4>
                                                                            {step.description ? (
                                                                                <p className="text-sm text-foreground mt-2 leading-relaxed">
                                                                                    {step.description}
                                                                                </p>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="col-span-full text-center text-muted-foreground py-12">
                                                            Process details will be available soon.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </TabsContent>

                                <TabsContent value="temple" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-6xl mx-auto">
                                        {(() => {
                                            const templeId = (pooja as any).templeId;
                                            const templeIds = (pooja as any).templeIds || [];
                                            const singleTemple = templeId ? temples.find(t => t.id === templeId) : null;
                                            const mainTemples = templeIds.length > 0
                                                ? temples.filter(t => templeIds.includes(t.id))
                                                : (singleTemple ? [singleTemple] : []);

                                            const otherTemples = temples.filter(t => !templeIds.includes(t.id));

                                            // Fallback to existing text if no specific temple is linked or found
                                            if (mainTemples.length === 0) {
                                                return (
                                                    <div className="flex flex-col md:flex-row gap-8 items-center bg-orange-50/50 dark:bg-zinc-900/50 rounded-3xl p-8 border border-orange-100 dark:border-zinc-800">
                                                        <div className="w-full md:w-1/3 aspect-video bg-orange-100 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-[url('https://www.tourmyindia.com/blog//wp-content/uploads/2021/03/Popular-Temples-in-India.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
                                                            <div className="absolute inset-0 bg-black/20" />
                                                            <MapPin className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
                                                        </div>
                                                        <div className="flex-1 text-center md:text-left">
                                                            <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">Sacred Location</span>
                                                            <h3 className="text-2xl font-serif font-bold mb-4">Temple Details</h3>
                                                            <p className="text-lg text-foreground leading-relaxed">
                                                                {"Details about the conducting temples will be provided post booking."}
                                                            </p>
                                                            <Button variant="outline" className="mt-6 gap-2">
                                                                View on Map <ArrowRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="space-y-12">
                                                    {/* Main Temples - Image Left, Description Right */}
                                                    {mainTemples.length > 0 && (
                                                        <div className="space-y-12">
                                                            {mainTemples.map((temple, idx) => {
                                                                const isEven = idx % 2 === 0; // 0, 2, 4... = even
                                                                return (
                                                                    <div key={temple.id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                                                        {/* Even index: Image left, Description right */}
                                                                        {isEven && (
                                                                            <>
                                                                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                                                                                    <Image
                                                                                        src={temple.image}
                                                                                        alt={temple.name}
                                                                                        fill
                                                                                        className="object-cover transition-transform duration-700 hover:scale-105"
                                                                                    />
                                                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                                                                        <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-1">
                                                                                            <MapPin className="w-4 h-4" />
                                                                                            {temple.location}
                                                                                        </div>
                                                                                        <h3 className="text-white text-2xl font-bold font-serif">{temple.name}</h3>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex flex-col justify-center h-full py-4">
                                                                                    <span className="text-primary font-bold uppercase tracking-wider text-sm mb-3">Primary Temple</span>
                                                                                    <h3 className="text-3xl font-serif font-bold mb-6 text-foreground">{temple.name}</h3>
                                                                                    <div className="prose prose-orange dark:prose-invert max-w-none mb-8">
                                                                                        <p className="text-lg text-foreground leading-relaxed whitespace-pre-line text-justify">
                                                                                            {temple.description}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div className="flex flex-wrap gap-4">
                                                                                        <Button size="lg" className="rounded-full bg-gradient-sacred hover:shadow-lg hover:shadow-orange-500/25 transition-all text-white font-bold px-8">
                                                                                            Explore Temple
                                                                                        </Button>
                                                                                        <Button size="lg" variant="outline" className="rounded-full border-2 border-orange-100 dark:border-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-800 font-bold px-8 gap-2">
                                                                                            View on Map <ArrowRight className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        {/* Odd index: Description left, Image right */}
                                                                        {!isEven && (
                                                                            <>
                                                                                <div className="flex flex-col justify-center h-full py-4">
                                                                                    <span className="text-primary font-bold uppercase tracking-wider text-sm mb-3">Primary Temple</span>
                                                                                    <h3 className="text-3xl font-serif font-bold mb-6 text-foreground">{temple.name}</h3>
                                                                                    <div className="prose prose-orange dark:prose-invert max-w-none mb-8">
                                                                                        <p className="text-lg text-foreground leading-relaxed whitespace-pre-line text-justify">
                                                                                            {temple.description}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div className="flex flex-wrap gap-4">
                                                                                        <Button size="lg" className="rounded-full bg-gradient-sacred hover:shadow-lg hover:shadow-orange-500/25 transition-all text-white font-bold px-8">
                                                                                            Explore Temple
                                                                                        </Button>
                                                                                        <Button size="lg" variant="outline" className="rounded-full border-2 border-orange-100 dark:border-zinc-800 hover:bg-orange-50 dark:hover:bg-zinc-800 font-bold px-8 gap-2">
                                                                                            View on Map <ArrowRight className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                                                                                    <Image
                                                                                        src={temple.image}
                                                                                        alt={temple.name}
                                                                                        fill
                                                                                        className="object-cover transition-transform duration-700 hover:scale-105"
                                                                                    />
                                                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                                                                        <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-1">
                                                                                            <MapPin className="w-4 h-4" />
                                                                                            {temple.location}
                                                                                        </div>
                                                                                        <h3 className="text-white text-2xl font-bold font-serif">{temple.name}</h3>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Other Temples Grid */}
                                                    {/* {otherTemples.length > 0 && (
                                                        <div>
                                                            <h3 className="text-2xl font-serif font-bold mb-6 text-center">Other Sacred Temples</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {otherTemples.map((temple, idx) => (
                                                                    <div key={temple.id} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-orange-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
                                                                        <div className="relative aspect-[4/3] overflow-hidden">
                                                                            <Image
                                                                                src={temple.image}
                                                                                alt={temple.name}
                                                                                fill
                                                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                                                <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-1">
                                                                                    <MapPin className="w-3 h-3" />
                                                                                    {temple.location}
                                                                                </div>
                                                                                <h4 className="text-white text-lg font-bold">{temple.name}</h4>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-4">
                                                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                                                {temple.description}
                                                                            </p>
                                                                            <Button variant="outline" size="sm" className="w-full mt-4 rounded-full">
                                                                                Learn More <ArrowRight className="w-3 h-3 ml-1" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )} */}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </TabsContent>

                                <TabsContent value="packages" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-5xl mx-auto">
                                        <div className="text-center mb-10">
                                            <h3 className="text-3xl font-serif font-bold mb-4">Choose Your Package</h3>
                                            <p className="text-muted-foreground">Select the offering that suits your devotion</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {(pooja.packages || []).map((pkg: any, idx: number) => (
                                                <div key={idx} className="relative p-8 rounded-[2.5rem] border border-orange-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />

                                                    <div className="relative z-10">
                                                        <h4 className="text-2xl font-bold mb-3 font-serif">{pkg.name}</h4>
                                                        <p className="text-muted-foreground mb-8 text-lg min-h-[60px]">{pkg.description}</p>

                                                        <div className="flex items-end justify-between border-t border-orange-100 dark:border-zinc-800 pt-6">
                                                            <div>
                                                                <span className="text-sm text-muted-foreground block mb-1">Contribution</span>
                                                                <div className="flex items-center gap-1 text-3xl font-bold text-primary">
                                                                    <IndianRupee className="w-6 h-6" />
                                                                    {pkg.price}
                                                                </div>
                                                            </div>
                                                            <Button className="rounded-full px-8 py-6 text-lg font-bold bg-gradient-sacred hover:shadow-lg hover:shadow-orange-500/25 transition-all">
                                                                Select
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!pooja.packages || pooja.packages.length === 0) && (
                                                <p className="text-muted-foreground col-span-full text-center">Contact support for custom package inquiries.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="reviews" className="relative z-10 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="max-w-6xl mx-auto py-8">
                                        {/* Rating Summary Section */}

                                        {/* Reviews Grid */}
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {((pooja as any).reviews || []).map((review: any, idx: number) => (
                                                <div key={idx} className="group bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-orange-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg shadow-lg">
                                                                {review.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground">{review.name}</div>
                                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {review.location}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <Star key={i} className={`w-4 h-4 ${i <= (review.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <p className="text-foreground leading-relaxed mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                                        "{review.message || "A divine experience that brought immense peace and spiritual clarity."}"
                                                    </p>

                                                    <div className="flex items-center justify-end pt-4 border-t border-orange-50 dark:border-zinc-800">
                                                        {/* <div className="text-xs text-muted-foreground">
                                                            Verified Purchase ✓
                                                        </div> */}
                                                        <div className="text-xs text-muted-foreground">
                                                            {review.date || "2 days ago"}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Empty State */}
                                        {(!(pooja as any).reviews || (pooja as any).reviews.length === 0) && (
                                            <div className="text-center py-16">
                                                <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-6">
                                                    <Star className="w-10 h-10 text-orange-500" />
                                                </div>
                                                <h3 className="text-2xl font-bold mb-4">No Reviews Yet</h3>
                                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                    Be the first to share your divine experience with this puja
                                                </p>
                                                <Button variant="outline" className="rounded-full">
                                                    Write a Review <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="faqs" className="mt-0 focus-visible:outline-none">
                                    <div className="max-w-6xl mx-auto">
                                        <div className="text-center mb-10">
                                            <h3 className="text-3xl font-serif font-bold mb-4 underline">Frequently  <span className="text-gradient-sacred"> Asked </span>  Questions</h3>
                                            <p className="text-foreground">Find answers to common questions about this puja</p>
                                        </div>

                                        <div className="space-y-2">
                                            {(pooja.faqs || []).map((faq: any, idx: number) => {
                                                const [isOpen, setIsOpen] = React.useState(false);
                                                return (
                                                    <div key={idx} className="border border-orange-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                        <button
                                                            onClick={() => setIsOpen(!isOpen)}
                                                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3">

                                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                    {faq.q}
                                                                </span>
                                                            </div>
                                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-6 pb-4 border-t border-orange-100 dark:border-zinc-800">
                                                                <div className="pl-8 pt-4">
                                                                    <p className="text-foreground leading-relaxed">
                                                                        {faq.a}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {(!pooja.faqs || pooja.faqs.length === 0) && (
                                            <div className="text-center py-12">
                                                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">No FAQs available yet. Contact us for any questions!</p>
                                                <Button variant="outline" className="mt-4">
                                                    Contact Support <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
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
