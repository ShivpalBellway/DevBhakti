"use client";

import React, { useEffect, useState } from "react";
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
    Video,
    Calendar,
    Heart,
    Share2,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
} from "lucide-react";

// Local temple images for hero banner & gallery

import { temples } from "@/data/temples";
import { Temple } from "@/types/temple";

const badgeColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-yellow-100 text-yellow-700",
];

export default function TempleDetail() {
    const params = useParams();
    const [isFavorite, setIsFavorite] = useState(false);

    const numericId = Number(params?.id);
    const temple =
        temples.find((t) => t.id === numericId) ??
        temples[0];

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);

    // Reset slider when temple changes
    useEffect(() => {
        setActiveImageIndex(0);
        setIsAutoScrolling(true);
    }, [numericId]);

    const heroImages =
        temple.heroImages && temple.heroImages.length > 0
            ? temple.heroImages
            : [temple.image];

    // Navigation functions
    const goToNext = () => {
        setIsAutoScrolling(false);
        setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    };

    const goToPrev = () => {
        setIsAutoScrolling(false);
        setActiveImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    const goToImage = (index: number) => {
        setIsAutoScrolling(false);
        setActiveImageIndex(index);
    };

    // Auto-scroll hero banner (only if user hasn't manually navigated)
    useEffect(() => {
        if (heroImages.length <= 1 || !isAutoScrolling) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [heroImages.length, isAutoScrolling]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Image Carousel */}
            <section className="relative h-[50vh] md:h-[60vh] overflow-hidden mt-20">
                <img
                    src={
                        (heroImages[activeImageIndex] as any).src ||
                        heroImages[activeImageIndex]
                    }
                    alt={temple.name}
                    className="w-full h-full object-cover transition-opacity duration-700"
                />
                {/* <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" /> */}

                {/* Back Button */}
                {/* <Link
                    href="/temples"
                    className="absolute top-20 left-4 md:left-8 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors z-20"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link> */}

                {/* Actions */}
                <div className="absolute top-20 right-4 md:right-8 flex gap-2 z-20">
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

                {/* Left/Right Navigation Arrows */}
                {heroImages.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors z-20"
                            onClick={goToPrev}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors z-20"
                            onClick={goToNext}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}

                {/* Image Indicators (Thumbnails) */}
                {heroImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 p-4 rounded-lg">
                        {heroImages.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${index === activeImageIndex
                                    ? "border-primary scale-110 shadow-lg shadow-primary/50"
                                    : "border-transparent  hover:opacity-100 hover:scale-105"
                                    }`}
                            >
                                <img
                                    src={(img as any).src || img}
                                    alt={`${temple.name} ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {index === activeImageIndex && (
                                    <div className="absolute inset-0 bg-primary/20" />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Live Badge */}
                {/* {temple.liveStatus && (
                    <Badge className="absolute bottom-24 md:bottom-28 left-4 md:left-8 bg-red-500 text-white animate-pulse text-base px-4 py-2 z-20">
                        <span className="w-2 h-2 bg-white rounded-full mr-2" />
                        LIVE NOW
                    </Badge>
                )} */}
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
                                            {temple.category}
                                        </Badge>
                                        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                                            {temple.name}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                        <span className="font-bold text-foreground">{temple.rating}</span>
                                        <span className="text-muted-foreground text-sm">
                                            ({temple.reviews.toLocaleString()} reviews)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{temple.fullAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span>{temple.openTime}</span>
                                    </div>

                                </div>

                                <div className="flex flex-wrap gap-3">

                                    <span className="font-bold">Description</span>
                                    <span>{temple.description}</span>

                                    <span className="font-bold">History</span>
                                    <span>{temple.history}</span>
                                </div>

                                {/* <div className="flex flex-wrap gap-3">
                                    <Button variant="gold" className="gap-2" asChild>
                                        <Link href={`/booking?temple=${numericId}`}>
                                            <Calendar className="h-4 w-4" />
                                            Book Pooja
                                        </Link>
                                    </Button>

                                    <Button variant="outline" className="gap-2">
                                        <Video className="h-4 w-4" />
                                        Watch Live Darshan
                                    </Button>
                                </div> */}


                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="poojas" className="w-full">
                            <TabsList className="w-full justify-start bg-white text-black p-2 rounded-lg ">
                                <TabsTrigger value="poojas" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Poojas & Aartis</TabsTrigger>
                                {/* <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all">About</TabsTrigger> */}
                                <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Events</TabsTrigger>
                                {/* <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Gallery</TabsTrigger> */}
                            </TabsList>

                            <TabsContent value="about" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-display font-semibold mb-3">Description</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {temple.description}
                                            </p>
                                        </div>
                                        {temple.history && (
                                            <div>
                                                <h3 className="text-xl font-display font-semibold mb-3">History</h3>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {temple.history}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="poojas" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6">
                                        {temple.poojas && temple.poojas.length > 0 ? (
                                            <div className="space-y-4">
                                                {temple.poojas.map((pooja, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-3  bold">{pooja.name}</h4>
                                                            {/* <p className="text-sm text-muted-foreground">{pooja.benefits?.join(", ")}</p> */}


                                                            {/* <div className="flex flex-wrap gap-2 mt-1">
  {pooja.benefits?.map((benefit, index) => (
    <span
      key={index}
      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap
        ${badgeColors[index % badgeColors.length]}`}
    >
      {benefit}
    </span>
  ))}
</div> */}

                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {pooja.benefits?.map((benefit, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="text-xs px-2.5 py-2 rounded-full 
                 bg-primary/10 text-primary
                 whitespace-nowrap"
                                                                    >
                                                                        {benefit}
                                                                    </span>
                                                                ))}
                                                            </div>



                                                            {/* <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                                {pooja.benefits?.map((benefit, index) => (
                                                                    <li key={index}>{benefit}</li>
                                                                ))}
                                                            </ul> */}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center text-primary font-semibold">
                                                                <IndianRupee className="h-4 w-4" />
                                                                {pooja.price}
                                                            </div>
                                                            <Button size="sm" asChild>
                                                                <Link href={`/booking?temple=${numericId}`}>Book Now</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                Detailed pooja schedule will be available soon.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="events" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6">
                                        {temple.upcomingEvents && temple.upcomingEvents.length > 0 ? (
                                            <div className="space-y-4">
                                                {temple.upcomingEvents.map((event, index) => (
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
                                        ) : (
                                            <p className="text-muted-foreground">
                                                Upcoming events will be listed here soon.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="gallery" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {temple.gallery?.map((img, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                            <img
                                                src={(img as any).src || img}
                                                alt={`${temple.name} gallery ${index + 1}`}
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
                                <CardTitle className="text-lg"></CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* <div>
                                    {temple.gallery?.map((img, index) => (
                                        <div key={index} className=" rounded-lg overflow-hidden">
                                            <img
                                                src={(img as any).src || img}
                                                alt={`${temple.name} gallery ${index + 1}`}
                                                className="w-10 h-10 object-cover hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div> */}

                                {temple.mapUrl && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <a
                                                href={temple.mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline"
                                            >
                                                Visit Location
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-border">
                                    {/* <Button className="w-full" size="lg" asChild>
                                        <Link href={`/donation?temple=${numericId}`}>
                                            <Heart className="h-4 w-4 mr-2" />
                                            Make Donation
                                        </Link>
                                    </Button> */}

                                    {/* Book Pooja and Watch Live Darshan Buttons Right Side*/}
                                    <div className="flex flex-wrap gap-3">
                                        <Button variant="gold" className="gap-2" asChild>
                                            <Link href={`/booking?temple=${numericId}`}>
                                                <Calendar className="h-4 w-4" />
                                                Book Pooja
                                            </Link>
                                        </Button>

                                        <Button variant="outline" className="gap-2">
                                            <Video className="h-4 w-4" />
                                            Watch Live Darshan
                                        </Button>
                                    </div>
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
