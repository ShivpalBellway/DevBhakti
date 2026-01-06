"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Info, Calendar, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// Enhanced Static data for temples
const temples = [
  {
    id: 1,
    name: "Kashi Vishwanath Temple",
    location: "Varanasi, Uttar Pradesh",
    thumbnail: "https://plus.unsplash.com/premium_photo-1697729536647-4e23a32dd324?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://youtu.be/U7FZyKlCXM8",
    liveViewers: "12,405",
    description: "The Kashi Vishwanath Temple is one of the most famous Hindu temples dedicated to Lord Shiva.",
    nextAarti: "06:30 PM",
  },
  {
    id: 2,
    name: "Siddhivinayak Temple",
    location: "Mumbai, Maharashtra",
    thumbnail: "https://images.unsplash.com/photo-1729372982394-38cc518a1256?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://www.youtube.com/embed/placeholder2",
    liveViewers: "8,192",
    description: "Shree Siddhivinayak Ganapati Mandir is a Hindu temple dedicated to Lord Shri Ganesh.",
    nextAarti: "07:00 PM",
  },
  {
    id: 3,
    name: "Tirupati Balaji Temple",
    location: "Tirumala, Andhra Pradesh",
    thumbnail: "https://images.unsplash.com/photo-1561032931-09034fb93094?q=80&w=1107&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://www.youtube.com/embed/placeholder3",
    liveViewers: "45,102",
    description: "Venkateswara Temple is an important landmark and is located in the hill town of Tirumala.",
    nextAarti: "Ongoing",
  },
  {
    id: 4,
    name: "Meenakshi Amman Temple",
    location: "Madurai, Tamil Nadu",
    thumbnail: "https://images.unsplash.com/photo-1544186673-c4881521545f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://www.youtube.com/embed/placeholder4",
    liveViewers: "5,620",
    description: "Arulmigu Meenakshi Sundaraswarar Temple is a historic Hindu temple located on the southern bank of the Vaigai River.",
    nextAarti: "06:00 PM",
  },
  {
    id: 5,
    name: "Jagannath Temple",
    location: "Puri, Odisha",
    thumbnail: "https://images.unsplash.com/photo-1621869606578-1561708a7e09?q=80&w=1107&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://www.youtube.com/embed/placeholder5",
    liveViewers: "22,340",
    description: "The Jagannath Temple is an important Hindu temple dedicated to Jagannath, a form of Sri Krishna.",
    nextAarti: "07:30 PM",
  },
  {
    id: 6,
    name: "Somnath Temple",
    location: "Prabhas Patan, Gujarat",
    thumbnail: "https://plus.unsplash.com/premium_photo-1697730370661-51bf72769ff6?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    videoUrl: "https://www.youtube.com/embed/placeholder6",
    liveViewers: "9,805",
    description: "The Somnath temple located in Prabhas Patan near Veraval in Saurashtra on the western coast of Gujarat.",
    nextAarti: "08:00 PM",
  },
];

export default function LiveDarshanPage() {
  const [selectedTemple, setSelectedTemple] = useState(temples[0]);
  const [isLikeActive, setIsLikeActive] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-sacred/30">
      <Navbar />

      <main className="relative pb-20 pt-20 overflow-x-hidden">
        {/* FULL WIDTH HERO VIDEO SECTION */}
        <section className="relative w-full h-[85vh] bg-black overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTemple.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <Image
                src={selectedTemple.thumbnail}
                alt={selectedTemple.name}
                fill
                className="object-cover opacity-90"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </motion.div>
          </AnimatePresence>

          {/* Overlay Content Container */}
          <div className="absolute inset-0 container  px-0 md:px-2  flex flex-col justify-between py-10 md:py-10 z-10 pointer-events-none">

            {/* Top Header Info (Overlay) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-red-600 hover:bg-red-600 border-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" /> LIVE
                  </Badge>
                  <Badge className="bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium">
                    <Users size={14} /> {selectedTemple.liveViewers} Viewers
                  </Badge>
                </div>
                {/* <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-none drop-shadow-2xl">
                  {selectedTemple.name.split(' ')[0]} <span className="text-sacred">Live</span>
                </h1> */}
              </motion.div>

              {/* Upcoming Event Badge */}
              <div className="hidden md:block">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-white text-right">
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Upcoming Event</p>
                  <p className="text-lg font-bold flex items-center justify-end gap-2">
                    <Calendar size={18} className="text-sacred" /> Aarti at {selectedTemple.nextAarti}
                  </p>
                </div>
              </div>
            </div>

            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-sacred/90 flex items-center justify-center cursor-pointer shadow-[0_0_50px_rgba(255,107,0,0.6)] backdrop-blur-md border-2 border-white/20 z-20 pointer-events-auto"
              >
                <Play className="fill-white text-white ml-2" size={48} />
              </motion.div>
            </div>

            {/* Bottom Info (Location & Full Name) */}
            <div className="pointer-events-auto">
              <div className="flex items-center gap-3 mb-2 text-white/90">
                <MapPin className="text-sacred" size={24} />
                <span className="text-xl font-medium tracking-wide uppercase shadow-black drop-shadow-lg">{selectedTemple.location}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-2xl opacity-90">{selectedTemple.name}</h2>
            </div>

          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 mt-12">
          {/* Sub-Action Bar (Moved below hero) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            <div className="lg:col-span-7">
              <h3 className="text-3xl font-bold mb-4">About the Darshan</h3>
              <p className="text-foreground text-lg leading-relaxed">{selectedTemple.description}</p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-4">
              <Button
                variant="outline"
                className={`h-14 px-8 rounded-xl gap-2 text-lg transition-all border-2 ${isLikeActive ? "bg-red-50 text-red-500 border-red-200" : "bg-transparent border-input hover:bg-accent"}`}
                onClick={() => setIsLikeActive(!isLikeActive)}
              >
                <Heart className={isLikeActive ? "fill-red-500 text-red-500" : ""} size={24} />
                {isLikeActive ? "Liked" : "Like"}
              </Button>
              <Button variant="sacred" className="h-14 px-10 rounded-xl text-lg font-bold shadow-lg hover:shadow-sacred/25 transition-all">
                Make Donation
              </Button>
              <Button variant="secondary" className="h-14 px-6 rounded-xl">
                <Share2 size={24} />
              </Button>
            </div>
          </div>

          {/* HORIZONTAL TEMPLE SELECTOR */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-foreground">
                <span className="w-10 h-1 bg-sacred rounded-full" /> Other Living Sanctuaries
              </h3>
              <Button variant="link" className="text-sacred text-lg font-bold">Discover All</Button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {temples.map((temple, idx) => (
                <motion.div
                  key={temple.id}
                  whileHover={{ y: -10 }}
                  onClick={() => setSelectedTemple(temple)}
                  className={`min-w-[320px] md:min-w-[400px] snap-start cursor-pointer transition-all duration-500 group ${selectedTemple.id === temple.id ? "opacity-100 ring-2 ring-sacred ring-offset-2 rounded-[2rem]" : "opacity-70 hover:opacity-100"
                    }`}
                >
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-md">
                    <Image
                      src={temple.thumbnail}
                      alt={temple.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-white font-black text-xl mb-1 line-clamp-1">{temple.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm font-medium">{temple.location.split(',')[0]}</span>
                        {temple.id === selectedTemple.id && (
                          <Badge className="bg-red-500 text-[10px] font-black h-5 uppercase">Playing</Badge>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={16} fill="white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
