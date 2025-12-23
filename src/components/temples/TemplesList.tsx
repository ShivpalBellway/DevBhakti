"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Heart,
  Video,
  Calendar,
  Share2,
  ChevronLeft,
  Users,
  IndianRupee,
  Phone,
  Globe,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// We'll define the interfaces for our data here to be safe and clear in TS
interface Temple {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  liveStatus: boolean;
  openTime: string;
  fullAddress?: string;
  gallery?: string[];
  phone?: string;
  website?: string;
  description?: string;
  history?: string;
  poojas?: { name: string; time: string; price: number }[];
  upcomingEvents?: { name: string; date: string }[];
}

// Mock Data
import templeKashi from "@/assets/temple-kashi.jpg";
import templeTirupati from "@/assets/temple-tirupati.jpg";
import templeSiddhivinayak from "@/assets/temple-siddhivinayak.jpg";
import templeMeenakshi from "@/assets/temple-meenakshi.jpg";
import templeJagannath from "@/assets/temple-jagannath.jpg";
import templeSomnath from "@/assets/temple-somnath.jpg";

import { StaticImageData } from "next/image";

const temples = [
  {
    id: 1,
    name: "Kashi Vishwanath Temple",
    location: "Varanasi, Uttar Pradesh",
    image: templeKashi,
    rating: 4.9,
    reviews: 12500,
    category: "Shiva",
    liveStatus: true,
    openTime: "4:00 AM - 11:00 PM",
  },
  {
    id: 2,
    name: "Tirupati Balaji Temple",
    location: "Tirupati, Andhra Pradesh",
    image: templeTirupati,
    rating: 4.8,
    reviews: 25000,
    category: "Vishnu",
    liveStatus: true,
    openTime: "3:00 AM - 12:00 AM",
  },
  {
    id: 3,
    name: "Siddhivinayak Temple",
    location: "Mumbai, Maharashtra",
    image: templeSiddhivinayak,
    rating: 4.7,
    reviews: 8900,
    category: "Ganesha",
    liveStatus: false,
    openTime: "5:30 AM - 10:00 PM",
  },
  {
    id: 4,
    name: "Meenakshi Amman Temple",
    location: "Madurai, Tamil Nadu",
    image: templeMeenakshi,
    rating: 4.9,
    reviews: 15600,
    category: "Shakti",
    liveStatus: true,
    openTime: "5:00 AM - 12:30 PM",
  },
  {
    id: 5,
    name: "Jagannath Temple",
    location: "Puri, Odisha",
    image: templeJagannath,
    rating: 4.8,
    reviews: 11200,
    category: "Vishnu",
    liveStatus: false,
    openTime: "5:00 AM - 11:00 PM",
  },
  {
    id: 6,
    name: "Somnath Temple",
    location: "Somnath, Gujarat",
    image: templeSomnath,
    rating: 4.9,
    reviews: 9800,
    category: "Shiva",
    liveStatus: true,
    openTime: "6:00 AM - 9:00 PM",
  },
];

const categories = ["All", "Shiva", "Vishnu", "Shakti", "Ganesha", "Hanuman"];

export function TemplesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemples = temples.filter((temple) => {
    const matchesSearch =
      temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      temple.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || temple.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-24 pb-12 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                Discover Sacred Temples
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Explore thousands of temples across India and connect with divine experiences
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search temples by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-full border-2 border-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Temple Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <p className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredTemples.length}</span> temples
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemples.map((temple) => (
                <Link key={temple.id} href={`/temples/${temple.id}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={(temple.image as any).src || temple.image}
                        alt={temple.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {temple.liveStatus && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full mr-2" />
                          LIVE
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
                      >
                        {temple.category}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {temple.name}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{temple.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-foreground">{temple.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({temple.reviews.toLocaleString()})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{temple.openTime.split(" - ")[0]}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

// Separate detail view component to keep things organized if we were merging files, 
// but since we are doing page.tsx architecture, we'll keep it modular.
