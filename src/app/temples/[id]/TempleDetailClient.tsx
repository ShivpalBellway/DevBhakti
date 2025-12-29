"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin,
    Star,
    Clock,
    Phone,
    Globe,
    Video,
    Calendar,
    Heart,
    Share2,
    ChevronLeft,
    IndianRupee,
} from "lucide-react";

export const templeData = {
    id: 1,
    name: "Kashi Vishwanath Temple",
    location: "Varanasi, Uttar Pradesh",
    fullAddress: "Lahori Tola, Varanasi, Uttar Pradesh 221001",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200",
    gallery: [
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600",
        "https://images.unsplash.com/photo-1609947017136-9daf32a00321?w=600",
        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600",
    ],
    rating: 4.9,
    reviews: 12500,
    category: "Shiva",
    liveStatus: true,
    openTime: "4:00 AM - 11:00 PM",
    phone: "+91 542 239 2629",
    website: "https://shrikashivishwanath.org",
    description:
        "The Kashi Vishwanath Temple is one of the most famous Hindu temples dedicated to Lord Shiva. It is located in Vishwanath Gali of Varanasi, Uttar Pradesh, India. The temple stands on the western bank of the holy river Ganga, and is one of the twelve Jyotirlingas.",
    history:
        "The temple has been referenced in Hindu scriptures for a very long time as a central part of worship in the Shaiva philosophy. The original Vishwanath temple was destroyed by the army of Qutb-ud-din Aibak in 1194 CE. The temple was rebuilt by a Gujarati merchant, but was demolished again during the reign of Mughal emperor Aurangzeb.",
    poojas: [
        { name: "Mangala Aarti", time: "3:00 AM", price: 251 },
        { name: "Bhog Aarti", time: "11:15 AM", price: 501 },
        { name: "Sandhya Aarti", time: "7:00 PM", price: 351 },
        { name: "Shringar Aarti", time: "9:00 PM", price: 751 },
        { name: "Rudrabhishek", time: "On Request", price: 1100 },
    ],
    upcomingEvents: [
        { name: "Maha Shivaratri", date: "March 8, 2025" },
        { name: "Shravan Month", date: "July 2025" },
        { name: "Dev Deepawali", date: "November 2025" },
    ],
};

export default function TempleDetail() {
    const params = useParams();
    const [isFavorite, setIsFavorite] = useState(false);
    const id = params?.id; // In a real app we would use this to fetch data

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Image */}
            <section className="relative h-[50vh] md:h-[60vh]">
                <img
                    src={templeData.image}
                    alt={templeData.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/temples"
                    className="absolute top-20 left-4 md:left-8 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>

                {/* Actions */}
                <div className="absolute top-20 right-4 md:right-8 flex gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsFavorite(!isFavorite)}
                    >
                        <Heart
                            className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                        />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                    >
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>

                {/* Live Badge */}
                {templeData.liveStatus && (
                    <Badge className="absolute bottom-8 left-4 md:left-8 bg-red-500 text-white animate-pulse text-base px-4 py-2">
                        <span className="w-2 h-2 bg-white rounded-full mr-2" />
                        LIVE NOW
                    </Badge>
                )}
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 -mt-16 relative z-10 pb-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border/50">
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                    <div>
                                        <Badge variant="secondary" className="mb-2">
                                            {templeData.category}
                                        </Badge>
                                        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                                            {templeData.name}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                        <span className="font-bold text-foreground">{templeData.rating}</span>
                                        <span className="text-muted-foreground text-sm">
                                            ({templeData.reviews.toLocaleString()} reviews)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{templeData.fullAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span>{templeData.openTime}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button className="gap-2">
                                        <Video className="h-4 w-4" />
                                        Watch Live Darshan
                                    </Button>
                                    <Button variant="outline" className="gap-2" asChild>
                                        <Link href={`/booking?temple=${id}`}>
                                            <Calendar className="h-4 w-4" />
                                            Book Pooja
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="about" className="w-full">
                            <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg">
                                <TabsTrigger value="about">About</TabsTrigger>
                                <TabsTrigger value="poojas">Poojas</TabsTrigger>
                                <TabsTrigger value="events">Events</TabsTrigger>
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                            </TabsList>

                            <TabsContent value="about" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-display font-semibold mb-3">Description</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {templeData.description}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-display font-semibold mb-3">History</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {templeData.history}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="poojas" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {templeData.poojas.map((pooja, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{pooja.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{pooja.time}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center text-primary font-semibold">
                                                            <IndianRupee className="h-4 w-4" />
                                                            {pooja.price}
                                                        </div>
                                                        <Button size="sm" asChild>
                                                            <Link href={`/booking?temple=${id}`}>Book Now</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="events" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {templeData.upcomingEvents.map((event, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <Calendar className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground">{event.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{event.date}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        Remind Me
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="gallery" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {templeData.gallery.map((img, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                            <img
                                                src={img}
                                                alt={`${templeData.name} gallery ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-border/50 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{templeData.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Globe className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Website</p>
                                        <a
                                            href={templeData.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <Button className="w-full" size="lg" asChild>
                                        <Link href={`/donation?temple=${id}`}>
                                            <Heart className="h-4 w-4 mr-2" />
                                            Make Donation
                                        </Link>
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
