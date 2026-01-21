"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import productRudraksha from "@/assets/product-rudraksha.jpg";
import productDiya from "@/assets/product-diya.jpg";
import productIncense from "@/assets/product-incense.jpg";
import productGangajal from "@/assets/product-gangajal.jpg";

const products = [
  {
    name: "Sacred Rudraksha Mala",
    temple: "Kashi Vishwanath Temple",
    price: "₹1,299",
    rating: 4.9,
    image: productRudraksha,
    badge: "Bestseller",
  },
  {
    name: "Pure Brass Diya Set",
    temple: "Tirupati Balaji Temple",
    price: "₹599",
    rating: 4.8,
    image: productDiya,
    badge: "Limited",
  },
  {
    name: "Sandalwood Incense",
    temple: "Vaishno Devi Temple",
    price: "₹199",
    rating: 4.7,
    image: productIncense,
    badge: "Popular",
  },
  {
    name: "Holy Ganga Jal",
    temple: "Haridwar Ganga Temple",
    price: "₹149",
    rating: 5.0,
    image: productGangajal,
    badge: "Premium",
  },
];

const MarketplaceSection: React.FC = () => {
  return (
    <section id="marketplace" className="py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              Sacred <span className="text-primary">Items</span>
            </h2>
            <p className="text-foreground mt-1">Authentic spiritual products from temples</p>
          </div>
          <Button variant="ghost" className="text-primary hover:bg-primary/5" asChild>
            <Link href="/marketplace">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Horizontal Product Scroll */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="min-w-[200px] bg-card rounded-xl p-3 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {product.badge}
                  </span>
                </div>
                
                {/* Product Image */}
                <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden mb-3">
                  <img
                    src={(product.image as any).src || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Product Info */}
                <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-foreground mb-2 line-clamp-1">
                  {product.temple}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-primary text-sm">{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                </div>
                
                {/* <Button variant="outline" size="sm" className="w-full text-xs">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  Add to Cart
                </Button> */}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;
