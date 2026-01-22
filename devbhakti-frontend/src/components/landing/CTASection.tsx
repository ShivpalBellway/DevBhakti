"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import axios from "axios";

interface CTACard {
  id: string;
  title: string;
  points: string[];
  icon: string;
  buttonText: string;
  buttonLink: string;
  cardType: string;
  active: boolean;
  order: number;
}

const CTASection: React.FC = () => {
  const [ctaCards, setCTACards] = useState<CTACard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCTACards();
  }, []);

  const fetchCTACards = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/cms/cta-cards`);
      const activeCards = response.data.data.filter((card: CTACard) => card.active);
      setCTACards(activeCards.slice(0, 2)); // Only show first 2 active cards
    } catch (error) {
      console.error("Error fetching CTA cards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-8 md:py-10 bg-gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </section>
    );
  }

  if (ctaCards.length === 0) {
    return null; // Don't show section if no cards
  }

  return (
    <section className="py-8 md:py-10 bg-gradient-hero relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-sacred" />

      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
              Begin Your Sacred{" "}
              <span className="text-gradient-sacred">Journey Today</span>
            </h2>
            <p className="text-foreground text-lg max-w-2xl mx-auto mb-8">
              Join thousands of devotees and hundreds of temples already connected
              on DevBhakti. Start exploring, booking, and experiencing divine moments.
            </p>
          </motion.div>

          {/* Dynamic CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {ctaCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                className={
                  card.cardType === "primary"
                    ? "bg-gradient-sacred rounded-2xl p-8 relative overflow-hidden"
                    : "bg-card rounded-2xl p-8 border border-border shadow-soft"
                }
              >
                {card.cardType === "primary" && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                )}
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl ${card.cardType === "primary"
                      ? "bg-primary-foreground/10"
                      : "bg-primary/10"
                    } flex items-center justify-center mb-6`}>
                    <Image
                      src={card.icon.startsWith('http') ? card.icon : `${BASE_URL}${card.icon}`}
                      alt={card.title}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <h3 className={`text-xl font-serif font-bold mb-3 ${card.cardType === "primary"
                      ? "text-primary-foreground"
                      : "text-foreground"
                    }`}>
                    {card.title}
                  </h3>
                  <ul className="space-y-3 mb-6">
                    {card.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className={`flex items-center gap-2 text-sm ${card.cardType === "primary"
                            ? "text-primary-foreground/80"
                            : "text-foreground"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${card.cardType === "primary"
                            ? "bg-primary-foreground"
                            : "bg-primary"
                          }`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={card.cardType === "primary" ? "outline-light" : "outline-sacred"}
                    className="w-full"
                    asChild
                  >
                    <Link href={card.buttonLink}>
                      {card.buttonText}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
