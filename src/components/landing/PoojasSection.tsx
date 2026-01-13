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
    <section id="poojas" className="py-8 md:py-8 bg-white/15 relative overflow-hidden">
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
                  <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/40 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-2 h-[420px] flex flex-col">
                    {/* Background Image with bottom gradient for text readability */}
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={pooja.image}
                        alt={pooja.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Darker only at bottom 2/3 so image stays bright but text is always readable */}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/60 to-transparent group-hover:from-black/95 group-hover:via-black/70 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full text-white px-5 py-6">
                      {/* Header / Title */}
                      <div className="mt-auto space-y-3">
                        {/* <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/20">
                          <Sparkles className="w-4 h-4 text-[#F5C979]" />
                          <span className="text-xs tracking-[0.2em] uppercase text-[#FCEFD8]">
                            Sacred Ritual
                          </span>
                        </div> */}

                        <h3 className="text-2xl font-serif font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          {pooja.name}
                        </h3>
                      </div>

                      {/* Bullets */}
                      <div className="mt-4 space-y-2">
                        {/* <p className="text-xs text-[#FCEFD8]/80 uppercase tracking-[0.25em]">
                          Blessings you receive
                        </p> */}
                        <div className="flex flex-wrap gap-2">
                          {(pooja as any).bullets?.map((bullet: string, bIdx: number) => (
                            <span
                              key={bIdx}
                              className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/12 border border-white/25 text-[#FFF9EA] backdrop-blur-md"
                            >
                              {bullet}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" className="rounded-full border-[#88542B] text-[#88542B] hover:bg-[#88542B] hover:text-white" asChild>
            <Link href="/poojas">
              View All Poojas <ArrowRight className="w-4 h-4 ml-2" />
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


