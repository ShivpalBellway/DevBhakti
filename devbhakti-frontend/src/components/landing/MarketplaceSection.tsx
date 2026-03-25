"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, Package, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchPublicProducts, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";

interface Product {
  id: string;
  name: string;
  image: string | null;
  rating: number | null;
  temple?: {
    name: string;
  } | null;
  variants: Array<{
    price: number;
    stock: number;
  }>;
}

const MarketplaceSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [showRatings, setShowRatings] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsData, favoritesRes, settingsData] = await Promise.all([
          fetchPublicProducts({ limit: 8 }),
          fetchUserFavorites(),
          fetchRatingsSettings()
        ]);

        setProducts(productsData);

        if (settingsData && settingsData.settings) {
          setShowRatings(settingsData.settings.product.home);
        }

        if (favoritesRes.success && favoritesRes.data) {
          const productIds = favoritesRes.data
            .filter((f: any) => f.productId)
            .map((f: any) => f.productId);
          setFavorites(productIds);
        }
      } catch (error) {
        console.error("Failed to load marketplace data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation();

    const isFav = favorites.includes(id);

    // Optimistic Update
    setFavorites((prev) =>
      isFav ? prev.filter((f) => f !== id) : [...prev, id]
    );

    try {
      if (isFav) {
        await removeFavorite({ productId: id });
        toast({ title: "Removed from favorites" });
      } else {
        await addFavorite({ productId: id });
        toast({ title: "Added to favorites" });
      }
    } catch (error) {
      // Revert
      setFavorites((prev) =>
        isFav ? [...prev, id] : prev.filter((f) => f !== id)
      );
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="marketplace" className="py-4 bg-[#fdf6e9]/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-block px-3 py-1 bg-[#794A05]/10 text-[#794A05] text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
              Sacred Marketplace
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#2a1b01]">
              Divine <span className="text-[#794A05]">Offerings</span>
            </h2>
            <p className="text-slate-600 mt-2 max-w-md">Authentic spiritual products blessed and sourced from holy temples across India.</p>
          </div>
        </div>

        {/* Horizontal Product Scroll */}
        <div className="relative group/scroll">
          {/* Side Navigation Buttons */}
          {!isLoading && products.length > 0 && (
            <div className="hidden md:block">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 rounded-full w-12 h-12 bg-white shadow-xl border-2 border-[#794A05]/10 text-[#794A05] hover:bg-[#794A05] hover:text-white transition-all duration-300 flex items-center justify-center font-bold"
              >
                <ChevronLeft className="w-7 h-7" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 rounded-full w-12 h-12 bg-white shadow-xl border-2 border-[#794A05]/10 text-[#794A05] hover:bg-[#794A05] hover:text-white transition-all duration-300 flex items-center justify-center font-bold"
              >
                <ChevronRight className="w-7 h-7" />
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex gap-6 overflow-x-hidden">
              {[1, 2, 4, 5].map((i) => (
                <div key={i} className="min-w-[280px] bg-white rounded-[2rem] p-4 h-[380px] animate-pulse border border-[#794A05]/5">
                  <div className="aspect-[5/4] bg-slate-100 rounded-2xl mb-4" />
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-6 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-8 premium-scrollbar scrollbar-hide snap-x scroll-smooth"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="min-w-[280px] max-w-[280px] bg-white rounded-[2rem] p-4 border border-[#794A05]/10 shadow-sm hover:shadow-xl hover:shadow-[#794A05]/5 transition-all duration-500 group snap-start relative"
                >
                  <Link href={`/marketplace/product/${product.id}`}>
                    {/* Product Image */}
                    <div className="aspect-[5/4] bg-[#fdf6e9] rounded-2xl overflow-hidden mb-5 relative">
                      {product.image ? (
                        <img
                          src={`${BASE_URL}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#794A05]/20">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[#794A05] text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                          {product.temple?.name ? "Temple Sourced" : "Sacred Item"}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(e, product.id)}
                        className="absolute top-3 right-3 p-2.5 bg-white shadow-md border border-primary/10 rounded-full hover:bg-primary group/fav transition-all duration-300 transform hover:scale-105 active:scale-95 z-10"
                      >
                        <Heart
                          className={`w-4 h-4 transition-all duration-300 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-primary/60 group-hover/fav:text-white"}`}
                        />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-1 px-1">
                      <p className="text-[10px] font-bold text-[#794A05]/60 uppercase tracking-widest truncate">
                        {product.temple?.name || "DevBhakti Exclusive"}
                      </p>
                      <h4 className="font-display font-bold text-[#2a1b01] text-lg line-clamp-1 group-hover:text-[#794A05] transition-colors">
                        {product.name}
                      </h4>

                      <div className="flex items-center justify-between pt-3">
                        <span className="font-display font-bold text-[#794A05] text-xl">
                          {product.variants?.[0]?.price ? formatPrice(product.variants[0].price) : "N/A"}
                        </span>
                        {showRatings && (
                          <div className="flex items-center gap-1 bg-[#794A05]/5 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span className="text-[10px] font-bold text-[#794A05]">{product.rating || "4.5"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-[#794A05]/20">
              <Package className="w-12 h-12 text-[#794A05]/20 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Coming Soon to the Sacred Marketplace</p>
            </div>
          )}
        </div>

        {/* View All Button at bottom */}
        {!isLoading && products.length > 0 && (
          <div className="text-center mt-4">
            <Button variant="outline" className="rounded-full border-[#794A05] text-[#794A05] hover:bg-[#794A05] hover:text-white px-8 h-12 text-base font-bold transition-all duration-300 shadow-sm hover:shadow-lg" asChild>
              <Link href="/marketplace">
                View All Items <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketplaceSection;
