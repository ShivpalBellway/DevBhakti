"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import Image from "next/image";
import templeIcon from "@/assets/icons/temple-icon.png";

const CTASection: React.FC = () => {
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


            {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link href="/auth?mode=register">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline-sacred" size="xl" asChild>
                <Link href="/auth?mode=register&type=institution">
                  Register Your Temple
                </Link>
              </Button>
            </div> */}


          </motion.div>

          {/* Two column CTAs */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* For Devotees */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-sacred rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-primary-foreground/10 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary-foreground mb-3">
                  For Devotees
                </h3>
                <ul className="space-y-3 mb-6">
                  {[
                    "Book poojas and sevas online",
                    "Watch live darshan 24/7",
                    "Shop authentic spiritual products",
                    "Receive festival notifications",
                    "Make secure donations",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline-light" className="w-full" asChild>
                  <Link href="/auth?mode=register">
                    Sign Up as Devotee
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* For Institutions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card rounded-2xl p-8 border border-border shadow-soft"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Image src={templeIcon} alt="Temple Icon" width={32} height={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                Temples, Devotional Shops & Pandits
              </h3>
              <ul className="space-y-3 mb-6">
                {[
                  "Manage bookings and services",
                  "Stream live darshan",
                  "Sell products on marketplace",
                  "Track donations and reports",
                  "Automated logistics integration",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline-sacred" className="w-full" asChild>
                <Link href="/auth?mode=register&type=institution">
                  Register Your Temple
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
