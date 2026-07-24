"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, IndianRupee, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { fetchPublicPoojas } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { useLanguage } from "@/context/LanguageContext";
import { parseLocalizedValue, getDeduplicatedPoojas } from "@/utils/textUtils";

const PoojasSection: React.FC = () => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [poojas, setPoojas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<any>(null);
  const { t, language } = useLanguage();

  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFavorites();
    }
    loadPoojas();
  }, [language]);

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

  const loadPoojas = async () => {
    const data = await fetchPublicPoojas({ lang: language });

    // Sort poojas by lowest price
    const sortedData = [...data].sort((a, b) => {
      return getLowestPrice(a) - getLowestPrice(b);
    });

    const deduplicatedPoojas = getDeduplicatedPoojas(sortedData, 'en');

    setPoojas(deduplicatedPoojas);
    setLoading(false);
  };

  const getFullImageUrl = (imagePath: string | null, type: string = "Pooja") => {
    if (!imagePath) return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">${type}</text></svg>`;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
   const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
return `${API_URL.replace('/api', '')}${cleanPath}`;
  };  

  const getLowestPrice = (pooja: any) => {
    let prices: number[] = [pooja.price];

    if (pooja.packages) {
      try {
        const pkgs = typeof pooja.packages === 'string' ? JSON.parse(pooja.packages) : pooja.packages;
        if (Array.isArray(pkgs)) {
          pkgs.forEach((p: any) => p.price && prices.push(p.price));
        }
      } catch (e) { }
    }

    if (pooja.templeCopies && Array.isArray(pooja.templeCopies)) {
      pooja.templeCopies.forEach((copy: any) => {
        if (copy.price) prices.push(copy.price);
        if (copy.packages) {
          try {
            const pkgs = typeof copy.packages === 'string' ? JSON.parse(copy.packages) : copy.packages;
            if (Array.isArray(pkgs)) {
              pkgs.forEach((p: any) => p.price && prices.push(p.price));
            }
          } catch (e) { }
        }
      });
    }

    const validPrices = prices.filter(p => p > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : pooja.price;
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

  const toggleFavorite = async (e: React.MouseEvent, poojaId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to login as a devotee to add favourites.",
        variant: "destructive",
      });
      return;
    }

    const isFav = favorites.some((f) => f.poojaId === poojaId);
    try {
      if (isFav) {
        await removeFavorite({ poojaId });
        setFavorites(favorites.filter((f) => f.poojaId !== poojaId));
        toast({ title: "Removed from Favourites", description: "Pooja removed from your favourites.", variant: "success" });
      } else {
        await addFavorite({ poojaId });
        setFavorites([...favorites, { poojaId }]);
        toast({ title: "❤️ Added to Favourites", description: "Pooja added to your favourites!", variant: "success" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to update favourites",
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

  if (poojas.length === 0) return null;

  return (
    <section id="poojas" className="py-6 md:py-8 bg-white/5 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-sacred opacity-30" />

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
              {t('landing.landing_poojas.tagline')}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">
              {t('landing.landing_poojas.title1')}<span className="text-gradient-sacred">{t('landing.landing_poojas.title2')}</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              {t('landing.landing_poojas.description')}
            </p>
          </div>
        </motion.div>

        {/* Scrollable poojas container */}
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
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {poojas.map((pooja, index) => (
              <motion.div
                key={pooja.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex-shrink-0 w-[300px] md:w-[350px] snap-start"
              >
                <div className="relative group/card h-[400px]">
                  <Link href={`/poojas/${pooja.slug || pooja.id}`}>
                    <div className="bg-card rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col isolate">
                      {/* Background Image with bottom gradient for text readability */}
                      <div className="absolute inset-0 z-0 rounded-[2rem] overflow-hidden">
                        <img
                          src={getFullImageUrl(pooja.image)}
                          alt={parseLocalizedValue(pooja.name, language)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as any).src = "https://via.placeholder.com/400x500?text=Pooja"
                          }}
                        />
                        {/* Darker only at bottom 2/3 so image stays bright but text is always readable */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/60 to-transparent group-hover:from-black/95 group-hover:via-black/70 transition-all duration-300" />
                      </div>

                      <div className="relative z-10 flex flex-col h-full text-white px-5 py-6">
                        {/* Header / Title */}

                        <div className="mt-auto space-y-3">
                          <h3 className="text-2xl font-serif font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {parseLocalizedValue(pooja.name, language)}
                          </h3>
                        </div>

                        {/* Bullets */}
                        {/* <div className="mt-4 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(pooja as any).benefits?.slice(0, 3).map((benefit: string, bIdx: number) => (
                              <span
                                key={bIdx}
                                className="text-[14px] font-medium px-3 py-1 rounded-full bg-white/12 border border-white/25 text-[#FFF9EA] backdrop-blur-md"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div> */}

                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                          <div className="flex flex-col">
                            <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold">{t('landing.landing_poojas.starts_from')}</span>
                            <div className="flex items-center text-xl font-bold text-white">
                              <IndianRupee className="w-4 h-4" />
                              <span>{getLowestPrice(pooja)}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-full bg-white/10 border-white/20 text-white hover:bg-primary hover:border-primary transition-all text-xs h-8 px-4">
                            {t('landing.landing_poojas.know_more')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Favorite Button - Outside Link */}
                  <button
                    onClick={(e) => toggleFavorite(e, pooja.id)}
                    className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white shadow-md border border-primary/10 hover:bg-primary group/fav transition-all duration-300"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${favorites.some((f) => f.poojaId === pooja.id)
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

        <div className="text-center mt-1">
          <Button variant="outline" className="rounded-full border-[#88542B] text-[#88542B] hover:bg-[#88542B] hover:text-white" asChild>
            <Link href="/poojas">
              {t('landing.landing_poojas.view_all')} <ArrowRight className="w-4 h-4 ml-2" />
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

export default PoojasSection;
