"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, MapPin, Clock, IndianRupee, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllPoojasAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function ViewPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [pooja, setPooja] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPooja();
    }, []);

    const loadPooja = async () => {
        setIsLoading(true);
        try {
            const poojasData = await fetchAllPoojasAdmin();
            const foundPooja = poojasData.find((p: any) => p.id === poojaId);

            if (foundPooja) {
                setPooja(foundPooja);
            } else {
                toast({
                    title: "Error",
                    description: "Pooja not found",
                    variant: "destructive"
                });
                router.push('/admin/poojas');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load pooja",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/400";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!pooja) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{pooja.name}</h1>
                        <p className="text-muted-foreground">Pooja Details</p>
                    </div>
                </div>
                <Button onClick={() => router.push(`/admin/poojas/edit/${poojaId}`)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Pooja
                </Button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Image & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Image */}
                    <div className="aspect-square rounded-xl overflow-hidden border bg-muted">
                        <img
                            src={getImageUrl(pooja.image)}
                            alt={pooja.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Quick Info Card */}
                    <div className="bg-card border rounded-lg p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Quick Info</h3>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <IndianRupee className="w-4 h-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Base Price</p>
                                    <p className="font-semibold">₹{pooja.price}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="font-semibold">{pooja.duration}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Time</p>
                                    <p className="font-semibold">{pooja.time}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Temple</p>
                                    <p className="font-semibold">{pooja.temple?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Category</p>
                            <Badge variant="outline">{pooja.category}</Badge>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    {pooja.about && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-3">About</h3>
                            <p className="text-muted-foreground leading-relaxed">{pooja.about}</p>
                        </div>
                    )}

                    {/* Description Points */}
                    {pooja.description && pooja.description.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-3">Description</h3>
                            <ul className="space-y-2">
                                {pooja.description.map((desc: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span className="text-muted-foreground">{desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Benefits */}
                    {pooja.benefits && pooja.benefits.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-3">Benefits</h3>
                            <ul className="space-y-2">
                                {pooja.benefits.map((benefit: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">✓</span>
                                        <span className="text-muted-foreground">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Highlights/Bullets */}
                    {pooja.bullets && pooja.bullets.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-3">Highlights</h3>
                            <div className="flex flex-wrap gap-2">
                                {pooja.bullets.map((bullet: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                        {bullet}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Packages */}
                    {pooja.packages && pooja.packages.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-4">Packages</h3>
                            <div className="grid gap-4">
                                {pooja.packages.map((pkg: any, index: number) => (
                                    <div key={index} className="border rounded-lg p-4 bg-slate-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{pkg.name}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {pkg.description}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">₹{pkg.price}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Process Steps */}
                    {pooja.processSteps && pooja.processSteps.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-4">Ritual Process</h3>
                            <div className="space-y-4">
                                {pooja.processSteps.map((step: any, index: number) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{step.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FAQs */}
                    {pooja.faqs && pooja.faqs.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-4">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                {pooja.faqs.map((faq: any, index: number) => (
                                    <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                                        <h4 className="font-semibold text-sm mb-2">{faq.q}</h4>
                                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
