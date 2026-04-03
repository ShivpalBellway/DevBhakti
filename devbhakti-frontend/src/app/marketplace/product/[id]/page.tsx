"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Heart,
  Package,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  IndianRupee,
  Share2,
  Clock,
  RotateCcw,
  Check,
  ChevronRight,
} from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import CartDrawer from "@/components/marketplace/CartDrawer";
import { useToast } from "@/hooks/use-toast";
import { fetchProductByIdPublic, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { BASE_URL, API_URL } from "@/config/apiConfig";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string | null;
  status: string;
  image: string | null;
  templeId: string | null;
  temple?: {
    id: string;
    name: string;
    location: string;
  } | null;
  seller?: {
    id: string;
    name: string;
    location: string;
  } | null;
  categoryObj?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
  }>;
  highlights: string | null;
  longDescription: string | null;
  shippingInfo: string | null;
  origin: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { cartItems, addToCart: addToCartGlobal, updateQuantity, removeFromCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userHasSelectedVariant, setUserHasSelectedVariant] = useState(false);
  const [pincode, setPincode] = useState("");
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [serviceabilityData, setServiceabilityData] = useState<any>(null);
  const [showRatings, setShowRatings] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
      checkFavoriteStatus(params.id as string);
      loadRatingsSettings();
    }
  }, [params.id]);

  const loadRatingsSettings = async () => {
    try {
      const data = await fetchRatingsSettings();
      if (data && data.settings) {
        setShowRatings(data.settings.product.details);
      }
    } catch (error) {
      console.error("Error loading ratings settings:", error);
    }
  };

  const checkFavoriteStatus = async (productId: string) => {
    try {
      const res = await fetchUserFavorites();
      if (res.success && res.data) {
        const isFav = res.data.some((f: any) => f.productId === productId);
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error("Error checking favorite status", error);
    }
  };

  const checkServiceability = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode.",
        variant: "destructive",
      });
      return;
    }

    setCheckingServiceability(true);
    setServiceabilityData(null);
    try {
      const response = await axios.post(`${API_URL}/orders/check-serviceability`, {
        productId: params.id,
        pincode: pincode
      });

      if (response.data.success) {
        setServiceabilityData(response.data);
      } else {
        toast({
          title: "Serviceability Check Failed",
          description: response.data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Serviceability error:", error);
      toast({
        title: "Error",
        description: "Could not check serviceability at this moment.",
        variant: "destructive",
      });
    } finally {
      setCheckingServiceability(false);
    }
  };

  const loadProduct = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProductByIdPublic(id);
      setProduct(data);
      if (data.variants.length > 0) {
        setSelectedVariant(data.variants[0].id);
        setUserHasSelectedVariant(false);
      }
    } catch (err: any) {
      console.error("Error loading product:", err);
      setError(err.message || "Failed to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!product) return;

    // Optimistic Update
    setIsFavorite(!isFavorite);

    try {
      if (isFavorite) {
        await removeFavorite({ productId: product.id });
        toast({ title: "Removed from favorites", description: product.name, variant: "success" });
      } else {
        await addFavorite({ productId: id });
        toast({ title: "Added to favorites", description: product.name, variant: "success" });
      }
    } catch (error) {
      // Revert
      setIsFavorite(!isFavorite);
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const addToCart = () => {
    if (!product || !selectedVariant) return;

    const variant = product.variants.find(v => v.id === selectedVariant);
    if (!variant) return;

    addToCartGlobal({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price,
      image: variant.image || product.image || "",
      quantity: quantity,
      templeId: product.templeId,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} (${variant.name}) x ${quantity} added to cart`,
      variant: "success",
    });
    setCartOpen(true);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const currentVariant = product?.variants.find(v => v.id === selectedVariant);
  const totalPrice = currentVariant ? currentVariant.price * quantity : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/30 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-muted/30 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted/30 rounded w-3/4"></div>
                <div className="h-4 bg-muted/30 rounded w-1/2"></div>
                <div className="h-4 bg-muted/30 rounded w-1/3"></div>
                <div className="h-12 bg-muted/30 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Product not found</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6e9]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#794A05]/60 mb-8 overflow-x-auto whitespace-nowrap">
            <Link href="/marketplace" className="hover:text-[#794A05] transition-colors">
              Marketplace
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-[#4A2c01]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Product Images */}
            <div className="lg:col-span-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[4/3] max-h-[500px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#794A05]/10 border border-[#794A05]/5 group"
              >
                {(userHasSelectedVariant && currentVariant?.image) ? (
                  <img
                    src={`${BASE_URL}${currentVariant.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-900"
                  />
                ) : product.image ? (
                  <img
                    src={`${BASE_URL}${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-900"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-[#794A05]/10" />
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <Badge className="bg-[#794A05] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-none">
                    Sacred Item
                  </Badge>
                  {currentVariant && currentVariant.stock <= 5 && currentVariant.stock > 0 && (
                    <Badge variant="destructive" className="bg-red-500 text-white rounded-full font-bold">
                      Limited Stock
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Thumbnail Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4 p-2 overflow-x-auto pb-4 scrollbar-hide"
              >
                {/* Main Product Image Thumbnail */}
                {product.image && (
                  <button
                    onClick={() => {
                      setUserHasSelectedVariant(false);
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 transform ${!userHasSelectedVariant
                      ? "border-[#794A05] scale-105 shadow-lg shadow-[#794A05]/20"
                      : "border-white hover:border-[#794A05]/30 hover:scale-105"
                      } bg-white`}
                  >
                    <img
                      src={`${BASE_URL}${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}

                {/* Variant Thumbnails */}
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant.id);
                      setUserHasSelectedVariant(true);
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 transform ${userHasSelectedVariant && selectedVariant === variant.id
                      ? "border-[#794A05] scale-105 shadow-lg shadow-[#794A05]/20"
                      : "border-white hover:border-[#794A05]/30 hover:scale-105"
                      } bg-white`}
                  >
                    {variant.image ? (
                      <img
                        src={`${BASE_URL}${variant.image}`}
                        alt={variant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#794A05]/20" />
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>

              {/* Highlights Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-8 space-y-6 shadow-xl shadow-[#794A05]/5 border border-[#794A05]/5"
              >
                <h3 className="text-xl font-display font-bold text-[#4A2c01] border-b border-[#794A05]/10 pb-4">Highlights</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(product.highlights ? product.highlights.split(',').map(s => s.trim()) : [
                    "Directly from Temple Source",
                    "Blessed by Ved Pathis",
                    "Traditional Quality Standards",
                    "Carefully Packaged with Holy Ash",
                    "Community Support Contribution"
                  ]).map((item, id) => (
                    <li key={id} className="flex items-start gap-3 text-sm text-[#794A05] font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#794A05] mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-6 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Product Title & Rating */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {showRatings && (
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-amber-700">{product.rating || "4.2"}</span>
                      </div>
                    )}
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-display font-bold text-[#2a1b01] leading-tight mb-4">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4 py-4 border-y border-[#794A05]/10">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Price</span>
                      <span className="text-4xl font-display font-bold text-[#794A05]">
                        {currentVariant ? formatPrice(currentVariant.price) : "N/A"}
                      </span>
                    </div>
                    {currentVariant && currentVariant.stock === 0 && (
                      <div className="ml-auto">
                        <Badge variant="outline" className="text-red-500 border-red-500 font-bold">OUT OF STOCK</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#794A05] opacity-70">Description</h3>
                  <p className="text-slate-600 leading-relaxed text-base">
                    {product.description}
                  </p>
                </div>

                {/* Meta Information Grid (Moved Up) */}
                <div className="grid grid-cols-2 gap-6 p-6 bg-white rounded-3xl border border-[#794A05]/5 shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</span>
                    <p className="text-base font-bold text-[#2a1b01]">{product.origin || product.temple?.location || product.seller?.location || "India"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                    <p className="text-base font-bold text-[#2a1b01]">{product.categoryObj?.name || product.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</span>
                    <p className="text-base font-mono font-bold text-[#2a1b01]">{currentVariant?.id.slice(-8).toUpperCase() || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</span>
                    <p className="text-base font-bold text-[#794A05]">{product.temple?.name || product.seller?.name || "DevBhakti"}</p>
                  </div>
                </div>

                {/* Shipping Serviceability Check */}
                <div className="space-y-4 p-6 bg-amber-50/50 rounded-3xl border border-[#794A05]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-[#794A05]" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#794A05]">Check Delivery Availability</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#794A05] z-10" />
                      <Input
                        placeholder="Enter 6-digit Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 h-12 rounded-xl border-[#794A05]/20 focus-visible:ring-[#794A05] font-bold bg-white"
                      />
                    </div>
                    <Button
                      onClick={checkServiceability}
                      disabled={checkingServiceability || pincode.length !== 6}
                      className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-xl px-8 h-12 font-bold shadow-lg"
                    >
                      {checkingServiceability ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                    </Button>
                  </div>

                  <p className="text-xs font-semibold text-red-600/90 mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                    Note: Currently Shipping to International locations is not available.
                  </p>

                  {serviceabilityData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-2xl border-2 ${serviceabilityData.serviceable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                    >
                      {serviceabilityData.serviceable ? (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-emerald-800">Hurray! Serviceable at {serviceabilityData.pincode}</p>
                            <p className="text-sm text-emerald-700/80 font-medium">Estimated Delivery by: <span className="font-black underline">{serviceabilityData.edd}</span></p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <RotateCcw className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-red-800">Oops! Delivery Not Available</p>
                            <p className="text-sm text-red-700/80 font-medium">{serviceabilityData.message || "We don't ship to this pincode yet."}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Quantity and Actions */}
                <div className="space-y-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#fdf6e9] border border-[#794A05]/10 rounded-xl p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10 text-[#794A05] hover:bg-[#794A05]/5 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-[#794A05] text-lg">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={currentVariant?.stock ? quantity >= currentVariant.stock : true}
                        className="h-10 w-10 text-[#794A05] hover:bg-[#794A05]/5 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleFavorite}
                      className={`h-12 w-12 rounded-xl transition-all shadow-sm ${isFavorite ? "border-red-100 bg-red-50 text-red-500" : "border-[#794A05]/10 bg-white text-[#794A05]"
                        }`}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`} />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="w-full h-16 bg-[#794A05] hover:bg-[#5d3804] text-white rounded-2xl text-lg font-bold shadow-xl shadow-[#794A05]/20 transition-all hover:scale-[1.02]"
                      onClick={addToCart}
                      disabled={!currentVariant || currentVariant.stock === 0}
                    >
                      <ShoppingCart className="w-6 h-6 mr-3" />
                      Add to Sacred Cart — {currentVariant ? formatPrice(totalPrice) : ""}
                    </Button>

                    <p className="text-xs text-center text-slate-400 font-medium">
                      Part of the proceeds are contributed toward temple maintenance
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

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

      <Footer />
    </div>
  );
}
