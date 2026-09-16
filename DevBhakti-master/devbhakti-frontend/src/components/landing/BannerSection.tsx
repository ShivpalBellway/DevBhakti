"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { API_URL, BASE_URL } from "@/config/apiConfig";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";

const BannerSection: React.FC = () => {
    const router = useRouter();
    const [banners, setBanners] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [loading, setLoading] = useState(true);
    const [isSectionActive, setIsSectionActive] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const { language, t } = useLanguage();

    const handleBannerClick = (banner: any) => {
        if (!banner || !banner.targetType || banner.targetType === 'NONE') return;

        const { targetType, targetId, targetSlug, customUrl } = banner;

        switch (targetType) {
            case 'POOJA':
                if (targetSlug) router.push(`/poojas/${targetSlug}`);
                else if (targetId) router.push(`/poojas/${targetId}`);
                break;
            case 'TEMPLE':
                if (targetSlug) router.push(`/temples/${targetSlug}`);
                else if (targetId) router.push(`/temples/${targetId}`);
                break;
            case 'PRODUCT':
                if (targetId) router.push(`/marketplace/product/${targetId}`);
                break;
            case 'MANDAL':
                if (targetSlug) router.push(`/mandals/${targetSlug}`);
                else if (targetId) router.push(`/mandals/${targetId}`);
                break;
            case 'CONTEST':
                if (targetSlug) router.push(`/campaigns/${targetSlug}`);
                else router.push(`/campaigns/maza-ganesha`);
                break;
            case 'CUSTOM_URL':
                if (customUrl) {
                    if (customUrl.startsWith('http://') || customUrl.startsWith('https://')) {
                        window.open(customUrl, '_blank');
                    } else {
                        router.push(customUrl);
                    }
                }
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        const fetchBannersAndStatus = async () => {
            try {
                const [bannerRes, statusRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/cms/banners`, { params: { lang: language } }),
                    axios.get(`${API_URL}/admin/cms/banners/global-status`)
                ]);

                setIsSectionActive(statusRes.data.active);
                const activeBanners = bannerRes.data.data?.filter((b: any) => b.active) || [];
                setBanners(activeBanners);
            } catch (error) {
                console.error("Error fetching banner data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBannersAndStatus();
    }, [language]);

    const nextSlide = useCallback(() => {
        if (banners.length === 0) return;
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        if (banners.length === 0) return;
        setDirection(-1);
        setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    }, [banners.length]);

    useEffect(() => {
        if (isPaused || banners.length === 0) return;

        const timer = setInterval(() => {
            nextSlide();
        }, 2500); // Slightly faster - 2.5 seconds

        return () => clearInterval(timer);
    }, [isPaused, nextSlide, banners.length]);

    if (!loading && (!isSectionActive || banners.length === 0)) return null;
    if (loading) return null;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 1 // Keep opacity 1 to avoid fading
        }),
        center: {
            x: 0,
            opacity: 1,
            zIndex: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 1,
            zIndex: 0
        })
    };

    const currentBanner = banners[currentIndex];
    const isClickable = currentBanner?.targetType && currentBanner?.targetType !== 'NONE';

    return (
        <section
            className="w-full py-0 bg-background relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="w-full px-0">
                <div
                    className={`relative w-full h-[220px] sm:h-[350px] md:h-[460px] lg:h-[580px] xl:h-[680px] 2xl:h-[750px] rounded-none overflow-hidden group bg-black/5 ${
                        isClickable ? 'cursor-pointer' : ''
                    }`}
                >
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 w-full h-full"
                            onClick={() => handleBannerClick(currentBanner)}
                        >
                            <motion.div
                                className="absolute inset-0 w-full h-full"
                                animate={{ scale: [1, 1.04, 1] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Image
                                    src={currentBanner.image.startsWith('http') ? currentBanner.image : `${BASE_URL}${currentBanner.image}`}
                                    alt={`${t('landing.banner.alt')} ${currentIndex + 1}`}
                                    fill
                                    className="object-cover object-center z-10"
                                    priority
                                />
                            </motion.div>
                            {/* Subtle Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-20 pointer-events-none" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg z-30"
                            >
                                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg z-30"
                            >
                                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </>
                    )}

                    {/* Navigation Dots */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDirection(index > currentIndex ? 1 : -1);
                                        setCurrentIndex(index);
                                    }}
                                    className={`transition-all duration-500 rounded-full ${index === currentIndex
                                        ? "w-8 sm:w-10 h-2 bg-white shadow-glow"
                                        : "w-2 h-2 bg-white/50 hover:bg-white/80 hover:scale-125"
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Animated Progress Bar */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/10 z-30 pointer-events-none">
                            <motion.div
                                key={`progress-${currentIndex}-${isPaused}`}
                                initial={{ width: "0%" }}
                                animate={{ width: isPaused ? "0%" : "100%" }}
                                transition={{ duration: isPaused ? 0 : 2.5, ease: "linear" }}
                                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};


export default BannerSection;
