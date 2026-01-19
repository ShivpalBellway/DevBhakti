"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Star,
  ShoppingCart,
  Heart,
  Filter,
  IndianRupee,
  Truck,
  Shield,
  Gift,
  ArrowRight,
} from "lucide-react";
import CartDrawer, { CartItem } from "@/components/marketplace/CartDrawer";
import { useToast } from "@/hooks/use-toast";

// Images
import productRudraksha from "@/assets/product-rudraksha.jpg";
import productDiya from "@/assets/product-diya.jpg";
import productIncense from "@/assets/product-incense.jpg";
import productGangajal from "@/assets/product-gangajal.jpg";
import productKalash from "@/assets/product-kalash.jpg";
import productShivaIdol from "@/assets/product-shiva-idol.jpg";
import productCamphor from "@/assets/product-camphor.jpg";
import productBhagavadGita from "@/assets/product-bhagavadgita.jpg";
import productGhee from "@/assets/product-ghee.jpg";

const products = [
  {
    id: 1,
    name: "Sacred Rudraksha Mala",
    description: "108 beads authentic Rudraksha mala for meditation",
    price: 1299,
    originalPrice: 1999,
    image: productRudraksha,
    rating: 4.8,
    reviews: 256,
    category: "Prayer Beads",
    badge: "Bestseller",
    inStock: true,
  },
  {
    id: 2,
    name: "Traditional Brass Diya",
    description: "Handcrafted brass oil lamp for daily worship",
    price: 449,
    originalPrice: 599,
    image: productDiya,
    rating: 4.6,
    reviews: 189,
    category: "Pooja Items",
    badge: null,
    inStock: true,
  },
  {
    id: 3,
    name: "Premium Incense Sticks",
    description: "Pack of 12 natural sandalwood fragrance sticks",
    price: 199,
    originalPrice: 299,
    image: productIncense,
    rating: 4.9,
    reviews: 412,
    category: "Incense",
    badge: "New",
    inStock: true,
  },
  {
    id: 4,
    name: "Holy Gangajal",
    description: "Pure Ganga water from Haridwar",
    price: 149,
    originalPrice: 199,
    image: productGangajal,
    rating: 4.7,
    reviews: 324,
    category: "Holy Water",
    badge: null,
    inStock: true,
  },
  {
    id: 5,
    name: "Copper Kalash Set",
    description: "Traditional copper pot set for rituals",
    price: 899,
    originalPrice: 1299,
    image: productKalash,
    rating: 4.5,
    reviews: 98,
    category: "Pooja Items",
    badge: null,
    inStock: true,
  },
  {
    id: 6,
    name: "Shiva Idol - Bronze",
    description: "Handcrafted Nataraja bronze statue",
    price: 2499,
    originalPrice: 3499,
    image: productShivaIdol,
    rating: 4.9,
    reviews: 156,
    category: "Idols",
    badge: "Premium",
    inStock: true,
  },
  {
    id: 7,
    name: "Camphor Tablets",
    description: "Pure camphor for aarti - Pack of 100",
    price: 249,
    originalPrice: 349,
    image: productCamphor,
    rating: 4.4,
    reviews: 287,
    category: "Pooja Items",
    badge: null,
    inStock: true,
  },
  {
    id: 8,
    name: "Bhagavad Gita - Deluxe",
    description: "Hardcover with Sanskrit and Hindi translation",
    price: 599,
    originalPrice: 799,
    image: productBhagavadGita,
    rating: 4.8,
    reviews: 445,
    category: "Books",
    badge: "Popular",
    inStock: true,
  },
  {
    id: 9,
    name: "Prasad - Ghee",
    description: "Pure ghee for aarti - Pack of 100",
    price: 599,
    originalPrice: 799,
    image: productGhee,
    rating: 4.8,
    reviews: 445,
    category: "Prasad",
    badge: "Popular",
    inStock: true,
  },
];

const categories = ["All", "Prayer Beads", "Pooja Items", "Incense", "Holy Water", "Idols", "Books", "Prasad"];

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Sync with query parameters
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const addToCart = (id: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setCartItems((prev) => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: (product.image as any).src || product.image,
        quantity: 1,
      }];
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    setCartOpen(false);
    // Passing state is tricky with Next router, usually use Context or query params.
    // For now we just navigate
    router.push("/marketplace/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Devotional Products
            </h1>
            <p className="text-lg text-foreground mb-8">
              Authentic spiritual products delivered to your doorstep
            </p>

            {/* Search Bar */}
            {/* <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full border-2 border-primary/20 focus:border-primary"
              />
            </div> */}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-foreground">
              <Truck className="h-5 w-5 text-primary" />
              <span>Quick Doorstep Delivery</span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Genuine Products</span>
            </div>

            {/* <div className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-5 w-5 text-primary" />
              <span>Gift Wrapping Available</span>
            </div> */}

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

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Categories
                  </h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={(product.image as any).src || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.badge && (
                      <Badge className="absolute top-3 left-3 bg-primary">
                        {product.badge}
                      </Badge>
                    )}
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
                    <p className="text-xs text-foreground mb-1">{product.category}</p>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-foreground">
                        ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center font-bold text-foreground">
                          <IndianRupee className="h-4 w-4" />
                          {product.price}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                      </div>
                      <Button size="sm" onClick={() => addToCart(product.id)}>
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
        onCheckout={handleCheckout}
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
