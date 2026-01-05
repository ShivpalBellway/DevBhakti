"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, IndianRupee, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { poojas } from "@/data/poojas";

const PoojasSection: React.FC = () => {
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

  return (
    <section id="poojas" className="py-16 md:py-24 bg-gradient-warm relative overflow-hidden">
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
              Sacred Services
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2">
              Book{" "}
              <span className="text-gradient-sacred">Poojas & Aartis</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Experience divine rituals and ceremonies
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

        {/* Scrollable poojas container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
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
                className="flex-shrink-0 w-[300px] md:w-[340px]"
              >
                <Link href={`/poojas/${pooja.id}`}>
                  <div className="group relative bg-card rounded-2xl p-6 overflow-hidden border-2 border-border/50 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-2 h-[420px] flex flex-col">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={pooja.image}
                        alt={pooja.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 group-hover:via-black/50 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full text-white">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {/* <Badge variant="secondary" className="mb-2 bg-primary/20 text-white border-0 backdrop-blur-md">
                            {pooja.category}
                          </Badge> */}
                          <h3 className="text-xl text-right font-serif font-bold text-white mb-1 group-hover:text-white transition-colors">
                            {pooja.name}
                          </h3>
                        </div>
                        {/* <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/20">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div> */}
                      </div>

                      {/* Description */}
                      <p className="text-gray-200 text-right text-sm mb-4 flex-1 line-clamp-3">
                        {/* {pooja.description} */}
                      </p>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{pooja.duration}</span>
                          {pooja.time !== "Flexible" && pooja.time !== "On Request" && (
                            <span className="text-[#FDF2E5] font-medium">• {pooja.time}</span>
                          )}
                        </div>
                        {pooja.time === "Flexible" && (
                          <div className="text-xs text-gray-400">
                            Time: Flexible
                          </div>
                        )}
                        {pooja.time === "On Request" && (
                          <div className="text-xs text-gray-400">
                            Time: On Request
                          </div>
                        )}
                        <div className="text-sm text-gray-300 line-clamp-4">
                          {pooja.description}
                        </div>

                      </div>

                      {/* Price and CTA */}
                      {/* <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-5 h-5 text-white" />
                          <span className="text-2xl font-bold text-[#FDF2E5]">
                            {pooja.price}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#FDF2E5] hover:text-primary hover:bg-white/10"
                        >
                          Book Now <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div> */}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        {/* <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/booking">
              View All Poojas <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div> */}
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


