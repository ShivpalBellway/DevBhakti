"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

import { fetchPublicTemples } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";

const categories = ["All", "Shiva", "Vishnu", "Shakti", "Ganesha", "Hanuman"];

export function TemplesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
    return matchesSearch && matchesCategory;
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
        <section className="relative pt-24 pb-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                Discover Sacred Temples
              </h1>
              <p className="text-lg text-foreground">
                Explore thousands of temples across India and connect with divine experiences
              </p>
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
              <p className="text-foreground">
                Showing <span className="font-semibold text-foreground">{filteredTemples.length}</span> temples
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemples.map((temple) => (
                <div key={temple.id} className="relative group/card h-full">
                  <Link href={`/temples/${temple.id}`}>
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
                          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
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
                    className="absolute top-3 right-12 z-30 p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background/80 transition-all group/fav"
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
