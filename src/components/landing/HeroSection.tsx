"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Sparkles, Bell, Search } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { Button } from "@/components/ui/button";
import heroTempleImage from "@/assets/hero-temple.jpg";
import templeIcon from "@/assets/icons/temple-icon.png";
import pujaIcon from "@/assets/icons/puja.png";


const HeroSection: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={heroTempleImage}
          alt="Sacred temple at sunrise"
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
      </div>

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Connecting Devotees with Sacred Spaces
            </span>
          </motion.div> */}

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-tight mb-6"
          >
            Your Digital Gateway to{" "}
            <span className="text-gradient-sacred">Divine Experiences</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Discover temples, book poojas, watch live darshan, explore sacred marketplace,
            and stay connected with your favorite institutions — all in one platform.
          </motion.p>

          {/* Hero Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <div
              onClick={() => setIsSearchOpen(true)}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-all rounded-full" />
              <div className="relative flex items-center bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl rounded-2xl p-2 pl-4 md:pl-6 transition-all group-hover:border-primary/50 group-hover:scale-[1.02]">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-primary mr-3 md:mr-4 group-hover:scale-110 transition-transform" />
                <div className="flex-1 text-left py-2 md:py-3">
                  <span className="text-zinc-500 text-sm md:text-lg block">Search Temples, Poojas, Products and more...</span>
                </div>
                <button className="bg-primary text-white px-5 md:px-8 py-2 md:py-3 rounded-xl font-medium shadow-lg hover:shadow-primary/30 transition-all">
                  Search
                </button>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button variant="hero" size="xl" asChild>
              <Link href="/auth?mode=register">
                Book Pooja
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline-sacred" size="xl" asChild>
              <a href="#darshan">
                <Play className="w-5 h-5" />
                View Live Darshan
              </a>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "500+", label: "Temples" },
              { value: "50K+", label: "Devotees" },
              { value: "1M+", label: "Bookings" },
              { value: "24/7", label: "Live Darshan" },
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          {[
            {
              icon: templeIcon,
              isImage: true,
              title: "Find Nearby Temples",
              description: "Discover sacred places near you",
            },
            {
              icon: Bell,
              title: "Instant Notifications",
              description: "Never miss festival updates",
            },
            {
              icon: pujaIcon,
              isImage: true,
              title: "Devotional Products",
              description: "Authentic spiritual products",
            },
          ].map((feature: any, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-sacred flex items-center justify-center mb-3">
                {feature.isImage ? (
                  <Image src={feature.icon} alt={feature.title} width={24} height={24} className="w-6 h-6 object-contain invert brightness-0" />
                ) : (
                  <feature.icon className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </section>
  );
};

export default HeroSection;
