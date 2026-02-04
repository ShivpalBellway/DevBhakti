"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  ShoppingCart,
  Heart,
  Filter,
  IndianRupee,
  Truck,
  Shield,
  Package,
  ArrowRight,
} from "lucide-react";
import CartDrawer from "@/components/marketplace/CartDrawer";
import { useCart, CartItem } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { fetchPublicProducts } from "@/api/publicController";
import { fetchActiveCategoriesAdmin } from "@/api/adminController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  image: string | null;
  templeId?: string | null;
  categoryId?: string | null;
  highlights?: string | null;
  longDescription?: string | null;
  shippingInfo?: string | null;
  origin?: string | null;
  rating?: number | null;
  sellerId?: string | null;
  temple?: {
    name: string;
  } | null;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
  };
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const { cartItems, addToCart: addToCartGlobal, updateQuantity, removeFromCart, totalAmount } = useCart();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync with query parameters
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Load data
  useEffect(() => {
    loadCategories();
    loadProducts();
    loadFavorites();
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await fetchActiveCategoriesAdmin();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await fetchUserFavorites();
      if (res.success && res.data) {
        // Filter only product favorites and map to IDs
        // Assuming response data structure from backend: { productId: "...", ... }
        const productIds = res.data
          .filter((f: any) => f.productId)
          .map((f: any) => f.productId);
        setFavorites(productIds);
      }
    } catch (error) {
      console.error("Error loading favorites", error);
    }
  };

  const loadProducts = async () => {
    // ... items
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        search: searchQuery || undefined,
      };

      if (selectedCategory !== "All") {
        // Find category by ID and use its name for API
        const category = categories.find(c => c.id === selectedCategory);
        if (category) {
          params.category = category.name; // Use category name for API
        }
      }

      const data = await fetchPublicProducts(params);
      setProducts(data);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesPrice = product.variants.some(v =>
      v.price >= priceRange[0] && v.price <= priceRange[1]
    );
    return matchesPrice;
  });

  const toggleFavorite = async (id: string) => {
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
      // Revert on error
      setFavorites((prev) =>
        isFav ? [...prev, id] : prev.filter((f) => f !== id)
      );
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const addToCart = (product: Product) => {
    // Use first variant for cart
    const variant = product.variants[0];
    if (!variant) return;

    addToCartGlobal({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price,
      image: product.image || "",
      quantity: 1,
      templeId: product.templeId,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
    setCartOpen(true);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const getPriceRange = (product: Product) => {
    if (product.variants.length === 0) return formatPrice(0);
    const prices = product.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/sacred_marketplace_hero_bg.png"
            alt="Sacred Marketplace"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        </div>

        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('/images/sacred_marketplace_hero_pattern.png')] opacity-10" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-foreground mb-6 leading-tight"
            >
              Sacred Marketplace
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 mb-10"
            >
              Discover authentic devotional items, pooja essentials, and spiritual treasures
              delivered directly from sacred temples to your home.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-2xl mx-auto"
            >
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#794A05]/50" />
              <Input
                type="text"
                placeholder="Search for idols, incense, books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 text-lg rounded-2xl border-2 border-[#794A05]/10 focus:border-[#794A05]/30 bg-white/80 backdrop-blur-sm shadow-lg shadow-[#794A05]/5 transition-all"
              />
            </motion.div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[
              { icon: Truck, text: "Fast Devine Delivery" },
              { icon: Shield, text: "100% Authentic & Blessed" },
              { icon: Package, text: "Secure Packaging" }
            ].map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-[#794A05]/10 text-sm font-medium text-[#794A05]"
              >
                <badge.icon className="h-4 w-4" />
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between group ${selectedCategory === "All"
                      ? "bg-[#794A05] text-white shadow-md shadow-[#794A05]/20"
                      : "text-slate-600 hover:bg-[#794A05]/5 hover:text-[#794A05]"
                      }`}
                  >
                    <span>All Products</span>
                    {selectedCategory === "All" && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between group ${selectedCategory === category.id
                        ? "bg-[#794A05] text-white shadow-md shadow-[#794A05]/20"
                        : "text-slate-600 hover:bg-[#794A05]/5 hover:text-[#794A05]"
                        }`}
                    >
                      <span className="truncate">{category.name}</span>
                      {selectedCategory === category.id && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Price Range
                  </h4>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={5000}
                    step={100}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-foreground">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-foreground">
                Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
              </p>
              <Button variant="outline" className="gap-2" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="h-4 w-4" />
                Cart ({cartItems.length})
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted/30 rounded-lg mb-4"></div>
                      <div className="h-4 bg-muted/30 rounded mb-2"></div>
                      <div className="h-3 bg-muted/30 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted/30 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadProducts}>Try Again</Button>
              </div>
            )}

            {/* No Products */}
            {!isLoading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden bg-muted">
                      {product.image ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/30">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}

                      <Badge className="absolute top-3 left-3 bg-primary">
                        {product.variants.length} {product.variants.length === 1 ? 'Variant' : 'Variants'}
                      </Badge>

                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                        onClick={() => toggleFavorite(product.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.includes(product.id)
                            ? "fill-red-500 text-red-500"
                            : ""
                            }`}
                        />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#794A05]/60">
                          {product.temple?.name || "DevBhakti Exclusive"}
                        </p>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] font-bold">4.5</span>
                        </div>
                      </div>

                      <h3 className="font-display font-semibold text-[#2a1b01] mb-1 line-clamp-1 group-hover:text-[#794A05] transition-colors">
                        <Link href={`/marketplace/product/${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>

                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-medium">Starting from</span>
                          <span className="font-bold text-[#794A05]">
                            {getPriceRange(product)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(product)}
                          className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-full px-4 h-8 transition-all hover:scale-105"
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setCartOpen(false);
          router.push("/marketplace/checkout");
        }}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Sacred Marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
