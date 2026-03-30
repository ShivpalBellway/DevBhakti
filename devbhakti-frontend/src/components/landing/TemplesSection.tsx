"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Video, ArrowRight, ChevronLeft, ChevronRight, BadgeCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { fetchPublicTemples, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { getTempleUrl } from "@/lib/utils/templeUtils";

const TemplesSection: React.FC = () => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [temples, setTemples] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<any>(null);
  const [showRatings, setShowRatings] = React.useState(false);

  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFavorites();
    }
    loadTemples();
    loadRatingsSettings();
  }, []);

  const loadRatingsSettings = async () => {
    try {
      const data = await fetchRatingsSettings();
      if (data && data.settings) {
        setShowRatings(data.settings.temple.home);
      }
    } catch (error) {
      console.error("Error loading ratings settings:", error);
    }
  };

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

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
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

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (temples.length === 0) return null;

  return (
    <section id="temples" className="py-2 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-lotus opacity-30" />

      <div className="container mx-auto px-4 relative z-10 mt-3">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8 "
        >
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Sacred Temples
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mt-1">
              Discover Divine <span className="text-gradient-sacred">Temples</span>
            </h2>
            <p className="text-sm text-foreground mt-1">
              Browse temples you can trust — curated and verified by DevBhakti
            </p>
          </div>

        </motion.div>

        {/* Scrollable temples container */}
        <div className="relative group/scroll">
          {/* Side Navigation Buttons */}
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-1/2 z-20 rounded-full w-12 h-12 bg-white shadow-2xl border-2 border-red-100 text-[#88542b] hover:bg-[#88542b] hover:text-white transition-all duration-300 flex items-center justify-center font-bold"
            >
              <ChevronLeft className="w-7 h-7" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-1/2 z-20 rounded-full w-12 h-12 bg-white shadow-2xl border-2 border-red-100 text-[#88542b] hover:bg-[#88542b] hover:text-white transition-all duration-300 flex items-center justify-center font-bold"
            >
              <ChevronRight className="w-7 h-7" />
            </Button>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {temples.map((temple, index) => (
              <motion.div
                key={temple.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex-shrink-0 w-[320px] md:w-[380px]"
              >
                <div className="relative group/card h-full">
                  <Link href={getTempleUrl(temple)}>
                    <div className="bg-card rounded-2xl overflow-hidden border-2 border-border/50 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-40 md:h-44 overflow-hidden">
                        <img
                          src={getFullImageUrl(temple.image)}
                          alt={temple.name}
                          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as any).src = "https://via.placeholder.com/400x300?text=Temple"
                          }}
                        />

                        {/* Category badge */}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary">{temple.category}</Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-grow">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-xl font-serif font-bold text-foreground group-hover/card:text-primary transition-colors leading-tight">
                            {temple.name}
                          </h3>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4E6] dark:bg-[#2C1810] border border-[#DEB887]/30 shrink-0 mt-0.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-[#D97706] fill-white dark:fill-[#2C1810]" />
                            <span className="text-[10px] font-bold text-[#92400E] dark:text-[#FCD34D] uppercase tracking-wider">Verified</span>
                          </div>
                        </div>

                        <p className="text-sm text-foreground mb-3 line-clamp-2">
                          {temple.description}
                        </p>



                        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="text-[10px] line-clamp-1">{temple.location}</span>
                            </div>
                            {showRatings && (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-secondary text-secondary" />
                                  <span className="font-bold text-[11px]">4.5</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  ({[432, 252, 125, 75][index % 4]})
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {temple.liveStatus && (
                              <div className="flex items-center gap-1 text-accent">
                                <Video className="w-3 h-3" />
                                <span className="text-[9px] font-medium uppercase tracking-tighter">Live</span>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 group-hover/card:text-primary text-[11px] font-medium"
                            >
                              Explore <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Favorite Button - Outside Link */}
                  <button
                    onClick={(e) => toggleFavorite(e, temple.id)}
                    className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white shadow-md border border-primary/10 hover:bg-primary group/fav transition-all duration-300"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${favorites.some((f) => f.templeId === temple.id)
                        ? "fill-red-500 text-red-500"
                        : "text-primary/60 group-hover/fav:text-white"
                        }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-1">
          <Button variant="outline" className="rounded-full border-[#88542B] text-[#88542B] hover:bg-[#88542B] hover:text-white" asChild>
            <Link href="/temples">
              View All Temples <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default TemplesSection;
