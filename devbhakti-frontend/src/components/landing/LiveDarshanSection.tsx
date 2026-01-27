"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Users, Radio, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import liveDarshanPreview from "@/assets/live-darshan-preview.jpg";

import { fetchPublicTemples } from "@/api/publicController";
import { API_URL } from "@/config/apiConfig";

const LiveDarshanSection: React.FC = () => {
  const [liveTemples, setLiveTemples] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadLiveTemples = async () => {
      const data = await fetchPublicTemples();
      const live = data.filter((t: any) => t.liveStatus).slice(0, 3);
      setLiveTemples(live);
      setLoading(false);
    };
    loadLiveTemples();
  }, []);

  if (loading) return null;
  if (liveTemples.length === 0) return null;

  return (
    <section id="darshan" className="py-16 md:py-20 bg-warm-brown relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Video Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <Link href={`/temples/${liveTemples[0]?.id}`}>
              <div className="relative rounded-2xl overflow-hidden bg-sidebar-accent aspect-video shadow-elevated group cursor-pointer">
                {/* Video preview image */}
                <img
                  src={liveTemples[0]?.image ? (liveTemples[0].image.startsWith('http') ? liveTemples[0].image : `${API_URL.replace('/api', '')}${liveTemples[0].image}`) : "/assets/live-darshan-preview.jpg"}
                  alt="Live darshan preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/20" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors shadow-lg">
                      <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-primary-foreground font-medium text-sm drop-shadow-lg">
                      Click to watch live darshan
                    </p>
                  </div>
                </div>

                {/* Live indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-primary-foreground px-3 py-1.5 rounded-full">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span className="text-xs font-semibold">LIVE</span>
                </div>

                {/* Viewer count */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-foreground/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full">
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-medium">{liveTemples[0]?.viewers || "1.2K"} watching</span>
                </div>
              </div>
            </Link>

            {/* Live temples list */}
            <div className="mt-6 space-y-3">
              {liveTemples.map((temple, index) => (
                <motion.div
                  key={temple.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    href={`/temples/${temple.id}`}
                    className="flex items-center justify-between bg-sidebar-accent/50 rounded-xl p-4 cursor-pointer hover:bg-sidebar-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <div>
                        <h4 className="font-medium text-sidebar-foreground text-sm">
                          {temple.name}
                        </h4>
                        <p className="text-xs text-sidebar-foreground/60">
                          {temple.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sidebar-foreground/60">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">{temple.viewers || "0"}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 lg:order-2"
          >
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Live Darshan
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-sidebar-foreground mt-3 mb-4">
              Experience Divine{" "}
              <span className="text-[#eea25a]">Darshan</span>{" "}
              from Anywhere
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Connect with sacred temples through low-latency live streaming.
              Watch morning aarti, evening prayers, and special ceremonies
              in real-time from the comfort of your home.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Radio, text: "Low-latency HD streaming" },
                { icon: Clock, text: "24/7 live coverage from major temples" },
                { icon: Users, text: "Join thousands of devotees watching" },
              ].map((feature) => (
                <div key={feature.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sidebar-foreground/90">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="sacred" size="lg" asChild>
              <Link href="/live-darshan">
                Watch Live Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveDarshanSection;
