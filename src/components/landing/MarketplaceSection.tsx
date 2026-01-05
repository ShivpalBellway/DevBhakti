"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import productRudraksha from "@/assets/product-rudraksha.jpg";
import productDiya from "@/assets/product-diya.jpg";
import productIncense from "@/assets/product-incense.jpg";
import productGangajal from "@/assets/product-gangajal.jpg";

import templeIcon from "@/assets/icons/temple-icon.png";

const products = [
  {
    name: "Sacred Rudraksha Mala",
    temple: "Kashi Vishwanath Temple",
    price: "₹1,299",
    rating: 4.9,
    image: productRudraksha,
  },
  {
    name: "Pure Brass Diya Set",
    temple: "Tirupati Balaji Temple",
    price: "₹599",
    rating: 4.8,
    image: productDiya,
  },
  {
    name: "Sandalwood Incense",
    temple: "Vaishno Devi Temple",
    price: "₹199",
    rating: 4.7,
    image: productIncense,
  },
  {
    name: "Holy Ganga Jal",
    temple: "Haridwar Ganga Temple",
    price: "₹149",
    rating: 5.0,
    image: productGangajal,
  },
];

const MarketplaceSection: React.FC = () => {
  return (
    <section id="marketplace" className="py-8 md:py-12 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Sacred Marketplace
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-3 mb-4">
              Authentic Spiritual{" "}
              <span className="text-gradient-sacred">Products</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Shop directly from temples and verified sellers. Get authentic puja items,
              prasad, religious artifacts, and spiritual merchandise delivered to your doorstep.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: templeIcon, isImage: true, text: "Temple Verified Products" },
                { icon: Truck, text: "Pan-India Delivery" },
                { icon: Star, text: "Quality Guaranteed" },
                { icon: ShoppingBag, text: "Easy Returns" },
              ].map((benefit: any) => (
                <div key={benefit.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    {benefit.isImage ? (
                      <Image
                        src={benefit.icon}
                        alt={benefit.text}
                        width={20}
                        height={20}
                        className="w-6 h-6 object-contain "
                      />
                    ) : (
                      (() => {
                        const IconComponent = benefit.icon as any;
                        return <IconComponent className="w-5 h-5 text-primary" />;
                      })()
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="sacred" size="lg" asChild>
              <Link href="/marketplace">
                Explore Marketplace
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Product Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-card rounded-2xl p-4 border border-border shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
                  <img
                    src={(product.image as any).src || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {product.temple}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{product.price}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    <span className="text-xs text-muted-foreground">
                      {product.rating}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;
