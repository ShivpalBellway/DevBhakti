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

import { fetchPublicTemples } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";

const TemplesSection: React.FC = () => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [temples, setTemples] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<any>(null);

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
    <section id="temples" className="py-16 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-lotus opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Sacred Temples
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">
              Discover Divine{" "}
              <span className="text-gradient-sacred">Temples</span>
            </h2>
            <p className="text-foreground mt-2">
              Browse temples you can trust — curated and verified by DevBhakti
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Scrollable temples container */}
        <div className="relative">
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
                  <Link href={`/temples/${temple.id}`}>
                    <div className="bg-card rounded-2xl overflow-hidden border-2 border-border/50 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-48 md:h-56 overflow-hidden">
                        <img
                          src={getFullImageUrl(temple.image)}
                          alt={temple.name}
                          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as any).src = "https://via.placeholder.com/400x300?text=Temple"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                        {/* Category badge */}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary">{temple.category}</Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-grow">
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

                        <div className="flex items-center gap-2 text-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{temple.location}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-secondary text-secondary" />
                            <span className="font-semibold text-foreground">{temple.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({(temple.reviewsCount || 0).toLocaleString()})
                            </span>
                          </div>
                          {temple.liveStatus && (
                            <div className="flex items-center gap-1 text-accent">
                              <Video className="w-4 h-4" />
                              <span className="text-xs font-medium">Live Darshan</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end pt-3 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover/card:text-primary"
                          >
                            Explore <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Favorite Button - Outside Link */}
                  <button
                    onClick={(e) => toggleFavorite(e, temple.id)}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 transition-all group/fav"
                  >
                    <Heart
                      className={`w-5 h-5 transition-all ${favorites.some((f) => f.templeId === temple.id)
                        ? "fill-red-500 text-red-500"
                        : "text-white group-hover/fav:text-red-200"
                        }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-4">
          <Button variant="outline" asChild>
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
