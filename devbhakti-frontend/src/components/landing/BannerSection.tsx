"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import banners
import banner1 from "@/assets/banners/banner1.webp";
import banner2 from "@/assets/banners/banner2.webp";
import banner3 from "@/assets/banners/banner3.webp";
// import banner4 from "@/assets/banners/banner4.webp";
// import banner5 from "@/assets/banners/banner5.webp";
import banner6 from "@/assets/banners/banner6.jpg";
import banner7 from "@/assets/banners/banner7.jpg";
import banner8 from "@/assets/banners/banner8.jpg";
import banner9 from "@/assets/banners/banner9.jpg";
import banner10 from "@/assets/banners/devBhakti_Banner_1.png";
import banner11 from "@/assets/banners/devBhakti_Banner_2.png";


import { API_URL, BASE_URL } from "@/config/apiConfig";

import axios from "axios";

// Static fallback banners
const staticBanners = [banner1, banner2, banner3, banner6, banner7, banner8, banner9, banner10, banner11];

const BannerSection: React.FC = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/cms/banners`);
                const activeBanners = response.data.data?.filter((b: any) => b.active) || [];
                if (activeBanners.length > 0) {
                    setBanners(activeBanners);
                }
            } catch (error) {
                console.error("Error fetching dynamic banners:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    const nextSlide = useCallback(() => {
        const length = banners.length > 0 ? banners.length : staticBanners.length;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        const length = banners.length > 0 ? banners.length : staticBanners.length;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + length) % length);
    }, [banners.length]);

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            nextSlide();
        }, 5000); // Change every 5 seconds

        return () => clearInterval(timer);
    }, [isPaused, nextSlide]);

    const displayBanners = banners.length > 0 ? banners : staticBanners;

    return (
        <section
            className="w-full relative py-8 bg-background overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)} >
            <div className="container mx-auto px-4">
                <div className="relative h-[180px] sm:h-[280px] md:h-[420px] rounded-[2rem] overflow-hidden shadow-2xl group">
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {banners.length > 0 ? (
                                <Image
                                    src={banners[currentIndex].image.startsWith('http') ? banners[currentIndex].image : `${BASE_URL}${banners[currentIndex].image}`}
                                    alt={`DevBhakti Sacred Banner ${currentIndex + 1}`}

                                    fill
                                    className="object-cover transform scale-105"
                                    priority
                                />
                            ) : (
                                <Image
                                    src={staticBanners[currentIndex]}
                                    alt={`DevBhakti Sacred Banner ${currentIndex + 1}`}
                                    fill
                                    className="object-cover transform scale-105"
                                    priority
                                />
                            )}
                            {/* Subtle Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 z-30"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 z-30"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
                        {displayBanners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`transition-all duration-500 rounded-full ${index === currentIndex
                                    ? "w-10 h-2 bg-white shadow-glow"
                                    : "w-2 h-2 bg-white/40 hover:bg-white/60 hover:scale-125"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/10 z-30">
                        <motion.div
                            key={`progress-${currentIndex}-${isPaused}`}
                            initial={{ width: "0%" }}
                            animate={{ width: isPaused ? "0%" : "100%" }}
                            transition={{ duration: isPaused ? 0 : 5, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-orange-400 to-yellow-400"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};


export default BannerSection;
