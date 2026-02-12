"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import { fetchPublicTemples } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { getTempleUrl } from "@/lib/utils/templeUtils";



export function TemplesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedPooja, setSelectedPooja] = useState("All");
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const categories = React.useMemo(() => {
    // Get unique categories and remove any empty strings or undefined values
    const uniqueCategories = Array.from(new Set(temples.map((t) => t.category?.trim()).filter(Boolean)));
    // Always start with "All"
    return ["All", ...uniqueCategories];
  }, [temples]);

  const locations = React.useMemo(() => {
    const uniqueLocations = Array.from(new Set(temples.map((t) => t.location?.trim()).filter(Boolean)));
    return ["All", ...uniqueLocations.sort()];
  }, [temples]);

  const poojaOptions = React.useMemo(() => {
    const poojaNames = temples.flatMap(t => (t.poojas || []).map((p: any) => p.name?.trim()));
    const uniquePoojas = Array.from(new Set(poojaNames)).filter(Boolean);
    return ["All", ...uniquePoojas.sort()];
  }, [temples]);

  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFavorites();
    }
    loadTemples();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await fetchUserFavorites();
      if (res.success) {
        setFavorites(res.data);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadTemples = async () => {
    const data = await fetchPublicTemples();
    setTemples(data);
    setLoading(false);
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "/placeholder.jpg";
    if (path.startsWith('http')) return path;
    return `${API_URL.replace('/api', '')}${path}`;
  };

  const toggleFavorite = async (e: React.MouseEvent, templeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/auth");
      return;
    }

    const isFav = favorites.some((f) => f.templeId === templeId);
    try {
      if (isFav) {
        await removeFavorite({ templeId });
        setFavorites(favorites.filter((f) => f.templeId !== templeId));
        toast({ title: "Removed from favorites" });
      } else {
        await addFavorite({ templeId });
        setFavorites([...favorites, { templeId }]);
        toast({ title: "Added to favorites" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const filteredTemples = temples.filter((temple) => {
    const matchesSearch =
      temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      temple.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || temple.category === selectedCategory;
    const matchesLocation =
      selectedLocation === "All" || temple.location === selectedLocation;
    const matchesPooja =
      selectedPooja === "All" || (temple.poojas || []).some((p: any) => p.name === selectedPooja);

    return matchesSearch && matchesCategory && matchesLocation && matchesPooja;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/images/sacred_temples_list_hero_bg.png"
              alt="Sacred Temples"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/70" />
          </div>

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/30 rounded-full blur-3xl animate-pulse-slow" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-foreground mb-6 leading-tight"
              >
                Discover Sacred Temples
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-foreground max-w-2xl mx-auto mb-10"
              >
                Explore thousands of temples across India and connect with divine experiences
              </motion.p>

              {/* Premium Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative max-w-2xl mx-auto group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                  <Search className="absolute left-5 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for temples, deities or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-32 py-5 text-lg outline-none text-zinc-800 bg-transparent placeholder:text-zinc-400"
                  />
                  <Button className="absolute right-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 hidden sm:flex">
                    Explore
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Streamlined Quick Filters Bar */}
        <section className="py-6 bg-white/40 backdrop-blur-md border-y border-primary/5 relative overflow-hidden pattern-sacred">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-primary/80 leading-none">Filter Experience</span>
                    <span className="text-xl font-serif font-bold text-foreground">Refine Discovery</span>
                  </div>
                </div>
                {(selectedCategory !== "All" || selectedLocation !== "All" || selectedPooja !== "All") && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedLocation("All");
                      setSelectedPooja("All");
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-all bg-primary/5 px-4 py-2 rounded-full border border-primary/10"
                  >
                    Reset All Filters
                  </motion.button>
                )}
              </div>

              {/* Enhanced Filter Bar with Spacing and Theme Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Dropdown */}
                <div className="relative group bg-white/80 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 p-1.5 px-2">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-primary/50 group-hover:text-primary transition-colors">
                    <Star className="h-5 w-5" />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full pl-12 border-none focus:ring-0 h-14 bg-transparent shadow-none hover:bg-primary/5 transition-colors rounded-xl">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] uppercase font-bold text-primary/40 tracking-wider">Divine Category</span>
                        <SelectValue placeholder="All Categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-primary/10 rounded-xl shadow-2xl">
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="py-3 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Dropdown */}
                <div className="relative group bg-white/80 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 p-1.5 px-2">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-primary/50 group-hover:text-primary transition-colors">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full pl-12 border-none focus:ring-0 h-14 bg-transparent shadow-none hover:bg-primary/5 transition-colors rounded-xl">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] uppercase font-bold text-primary/40 tracking-wider">Sanctum Location</span>
                        <SelectValue placeholder="All Locations" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-primary/10 rounded-xl shadow-2xl">
                      {locations.map((location) => (
                        <SelectItem
                          key={location}
                          value={location}
                          className="py-3 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
                        >
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Poojas Offered Dropdown */}
                <div className="relative group bg-white/80 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 p-1.5 px-2">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-primary/50 group-hover:text-primary transition-colors">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <Select value={selectedPooja} onValueChange={setSelectedPooja}>
                    <SelectTrigger className="w-full pl-12 border-none focus:ring-0 h-14 bg-transparent shadow-none hover:bg-primary/5 transition-colors rounded-xl">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] uppercase font-bold text-primary/40 tracking-wider">Ritual Type</span>
                        <SelectValue placeholder="All Poojas" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-primary/10 rounded-xl shadow-2xl">
                      {poojaOptions.map((pooja) => (
                        <SelectItem
                          key={pooja}
                          value={pooja}
                          className="py-3 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
                        >
                          {pooja}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Selection Feedback - Modernized Chips */}
              {(selectedCategory !== "All" || selectedLocation !== "All" || selectedPooja !== "All") && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 px-1">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Active:</span>
                  {selectedCategory !== "All" && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-primary/10 transition-colors">
                      <Star className="w-3 h-3 text-primary/60" />
                      {selectedCategory}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedCategory("All")} />
                    </Badge>
                  )}
                  {selectedLocation !== "All" && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-primary/10 transition-colors">
                      <MapPin className="w-3 h-3 text-primary/60" />
                      {selectedLocation}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedLocation("All")} />
                    </Badge>
                  )}
                  {selectedPooja !== "All" && (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-secondary/20 transition-colors">
                      <Calendar className="w-3 h-3 text-secondary/60" />
                      {selectedPooja}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedPooja("All")} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Temple Grid */}
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-foreground">
                Showing <span className="font-semibold text-foreground">{filteredTemples.length}</span> temples
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemples.map((temple) => (
                <div key={temple.id} className="relative group/card h-full">
                  <Link href={getTempleUrl(temple)}>
                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={getFullImageUrl(temple.image)}
                          alt={temple.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as any).src = "https://via.placeholder.com/400x300?text=Temple"
                          }}
                        />
                        {temple.liveStatus && (
                          <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full mr-2" />
                            LIVE
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
                        >
                          {temple.category}
                        </Badge>

                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {temple.name}
                        </h3>
                        <p className="text-sm text-foreground mb-3 line-clamp-2">
                          {temple.description}
                        </p>

                        <div className="flex items-center gap-2 text-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{temple.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-foreground">{temple.rating}</span>
                            <span className="text-muted-foreground text-sm">
                              ({(temple.reviewsCount || 0).toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Favorite Button - Outside Link */}
                  <button
                    onClick={(e) => toggleFavorite(e, temple.id)}
                    className="absolute top-3 right-1 z-30 p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background/80 transition-all group/fav"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all ${favorites.some((f) => f.templeId === temple.id)
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground group-hover/fav:text-red-500"
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
