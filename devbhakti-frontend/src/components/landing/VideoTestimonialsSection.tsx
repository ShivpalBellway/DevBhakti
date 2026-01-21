"use client";

import React, { useRef, useState, useEffect } from "react";

import { motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

import thumb1 from "@/assets/temple-kashi.jpg";
import thumb2 from "@/assets/poojas/satyanarayan puja.webp";
import thumb3 from "@/assets/temple-tirupati.jpg";
import thumb4 from "@/assets/temple-siddhivinayak.jpg";
import Image, { StaticImageData } from "next/image";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";


interface VideoStory {
    id: string | number;
    title: string;
    subtitle: string;
    videoSrc: string | any;
    thumbnail: StaticImageData | string;
    category: string;
}


const stories: VideoStory[] = [
    {
        id: 1,
        title: "Pandit Ji on 'Sankalpa'",
        subtitle: "Head Priest, Kashi Vishwanath",
        videoSrc: "/videos/video1.mp4",
        thumbnail: thumb1,
        category: "SANKALPA",
    },
    {
        id: 2,
        title: "Dr. Sharma on Ancient Texts",
        subtitle: "Sanskrit Scholar, Varanasi",
        videoSrc: "/videos/video2.mp4",
        thumbnail: thumb2,
        category: "SCRIPTURES",
    },
    {
        id: 3,
        title: "Power of Remote Offerings",
        subtitle: "Chief Archak, Tirupati",
        videoSrc: "/videos/video3.mp4",
        thumbnail: thumb3,
        category: "DISTANCE",
    },
    {
        id: 4,
        title: "Connecting from Abroad",
        subtitle: "Devotee Story, London",
        videoSrc: "/videos/video4.mp4",
        thumbnail: thumb4,
        category: "GLOBAL",
    },
];

const VideoTestimonialsSection = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [playingId, setPlayingId] = useState<string | number | null>(null);
    const [dynamicStories, setDynamicStories] = useState<VideoStory[]>([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/cms/testimonials`);
                if (response.data && response.data.length > 0) {
                    setDynamicStories(response.data);
                }
            } catch (error) {
                console.error("Error fetching testimonials:", error);
            }
        };
        fetchTestimonials();
    }, []);

    const storiesToDisplay = dynamicStories.length > 0 ? dynamicStories : stories;


    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 350; // approximate card width + gap
            const currentScroll = scrollContainerRef.current.scrollLeft;
            const targetScroll =
                direction === "left"
                    ? currentScroll - scrollAmount
                    : currentScroll + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="py-8 bg-amber-50/50 dark:bg-zinc-900/50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mb-6 rounded-full"
                    />
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-serif font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-6"
                    >
                        Does a Pooja Done on Your Behalf Carry the Same Meaning?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-zinc-600 dark:text-zinc-400 font-medium"
                    >
                        In our tradition, devotion and intent matter more than physical
                        distance. <br className="hidden md:block" />
                        Hear directly from the custodians of our faith.
                    </motion.p>
                </div>

                {/* Carousel Container */}
                <div className="relative group">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-orange-100 dark:border-zinc-700 items-center justify-center text-zinc-600 dark:text-zinc-300 hover:scale-110 transition-transform hidden md:flex"
                        aria-label="Previous videos"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-orange-100 dark:border-zinc-700 items-center justify-center text-zinc-600 dark:text-zinc-300 hover:scale-110 transition-transform hidden md:flex"
                        aria-label="Next videos"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Scrollable Area */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-4"
                    >
                        {storiesToDisplay.map((story, index) => (
                            <motion.div
                                key={story.id}

                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex-shrink-0 w-[280px] md:w-[310px] aspect-[9/14] relative rounded-2xl overflow-hidden snap-center cursor-pointer group/card shadow-xl"
                                onClick={() => setPlayingId(playingId === story.id ? null : story.id)}
                            >
                                {/* Video or Thumbnail */}
                                <div className="absolute inset-0 bg-black">
                                    {playingId === story.id ? (
                                        <video
                                            src={typeof story.videoSrc === 'string' && (story.videoSrc.startsWith('/') || story.videoSrc.startsWith('http'))
                                                ? (story.videoSrc.startsWith('http') ? story.videoSrc : `${BASE_URL}${story.videoSrc}`)
                                                : story.videoSrc}
                                            className="w-full h-full object-cover"
                                            controls
                                            autoPlay
                                            playsInline

                                            onError={() => {
                                                console.error("Video failed to load:", story.videoSrc);
                                                setPlayingId(null);
                                            }}
                                            onEnded={() => setPlayingId(null)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <>
                                            <Image
                                                src={typeof story.thumbnail === 'string' && (story.thumbnail.startsWith('/') || story.thumbnail.startsWith('http'))
                                                    ? (story.thumbnail.startsWith('http') ? story.thumbnail : `${BASE_URL}${story.thumbnail}`)
                                                    : story.thumbnail}
                                                alt={story.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover/card:scale-105 opacity-90"
                                            />

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/card:scale-110 transition-transform border border-white/30">
                                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center pl-1 shadow-lg">
                                                        <Play className="w-6 h-6 text-orange-600 fill-orange-600" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Text Content */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
                                                <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold tracking-wider uppercase bg-orange-500/90 rounded text-white font-sans">
                                                    {story.category}
                                                </span>
                                                <h3 className="text-xl font-bold font-serif leading-tight mb-1 text-shadow-sm">
                                                    {story.title}
                                                </h3>
                                                <p className="text-sm text-white/80 font-medium">
                                                    {story.subtitle}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer CTA */}
                {/* <div className="text-center mt-8">
                    <Button variant="outline" className="rounded-full bg-amber-100 hover:bg-amber-200 border-amber-200 text-amber-900 border-0">
                        📖 Read more about the scriptures
                    </Button>
                </div> */}
            </div>
        </section>
    );
};

export default VideoTestimonialsSection;
