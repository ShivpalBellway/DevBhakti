"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Play, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder images - using simple colored divs or existing assets if available
// In a real scenario, we'd import specific user avatars
import user1 from "@/assets/temple-kashi.jpg"; // Fallback for now
import user2 from "@/assets/temple-tirupati.jpg";
import user3 from "@/assets/temple-siddhivinayak.jpg";
import user4 from "@/assets/temple-meenakshi.jpg";

const reviews = [
    {
        id: 1,
        type: "video",
        thumbnail: user1,
        name: "Rajeshwari Devi",
        location: "Varanasi",
        rating: 5,
    },
    {
        id: 2,
        type: "text",
        content: "The live darshan feature is a blessing for my elderly parents who cannot travel. They feel connected to God every day. Thank you DevBhakti!",
        name: "Vikram Malhotra",
        location: "Mumbai",
        rating: 5,
        avatar: user2,
    },
    {
        id: 3,
        type: "text",
        content: "I booked a special Rudrabhishek puja for my daughter's birthday. The pundits were very knowledgeable and the entire process was seamless.",
        name: "Sneha Reddy",
        location: "Hyderabad",
        rating: 5,
        avatar: user3,
    },
    {
        id: 4,
        type: "text",
        content: "Very authentic experience. The prasad delivery was on time and packed beautifully. Felt the divine presence in my home.",
        name: "Amit Kumar",
        location: "Delhi",
        rating: 5,
        avatar: user4,
    },
];

const ReviewsSection: React.FC = () => {
    return (
        <section className="py-8 md:py-8 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4"
                    >
                       What Devotees Share
                    </motion.h2>

                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="w-16 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mb-6 rounded-full"
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-foreground text-lg"
                    >
                        Experiences shared by devotees from across india. 
                    </motion.p>
                </div>

                {/* Scrollable Container */}
                <div className="flex gap-6 overflow-x-auto overflow-hidden pb-8 snap-x snap-mandatory scrollbar-hide">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 w-80 md:w-[320px] snap-center"
                        >
                            <div className="h-full flex flex-col bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-sm border border-orange-100 dark:border-zinc-800 hover:shadow-md transition-shadow">

                                {/* Content Area */}
                                <div className="flex-1 mb-6">
                                    {review.type === "video" ? (
                                        <div className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer">
                                            <Image
                                                src={review.thumbnail}
                                                alt={review.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
                                                    <Play className="w-5 h-5 text-orange-600 fill-orange-600" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                                                0:00 / 1:00
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Quote className="w-8 h-8 text-orange-100 dark:text-orange-900/30 absolute -top-2 -left-2" />
                                            <p className="relative z-10 text-foreground italic text-sm md:text-base leading-relaxed">
                                                "{review.content}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-orange-50 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative border border-orange-100">
                                        <Image
                                            src={review.avatar || review.thumbnail}
                                            alt={review.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm">{review.name}</h4>
                                        <p className="text-xs text-foreground">{review.location}</p>
                                    </div>
                                    {/* Rating Stars - Optional visual feedback */}
                                    {/* <div className="ml-auto flex gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div> */}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pagination Dots (Visual only for now) */}
                <div className="flex justify-center gap-2 mt-4">
                    {reviews.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-orange-200 dark:bg-zinc-700'}`} />
                    ))}
                </div>

            </div>
        </section>
    );
};

export default ReviewsSection;
