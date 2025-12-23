"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ShoppingBag,
  Video,
  Bell,
  Heart,
  CreditCard,
  MapPin,
  Users,
  Truck,
  BarChart3,
  Shield,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book poojas, sevas, and time slots with just a few taps. Get instant confirmations.",
    color: "bg-primary",
  },
  {
    icon: Video,
    title: "Live Darshan",
    description: "Experience divine darshan from anywhere with low-latency live streaming.",
    color: "bg-accent",
  },
  {
    icon: ShoppingBag,
    title: "Sacred Marketplace",
    description: "Shop authentic spiritual products, prasad, and temple merchandise.",
    color: "bg-secondary",
  },
  {
    icon: Heart,
    title: "Easy Donations",
    description: "Support temples with secure digital donations and receive instant receipts.",
    color: "bg-primary",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay updated with festival alerts, booking reminders via WhatsApp & email.",
    color: "bg-accent",
  },
  {
    icon: MapPin,
    title: "Temple Discovery",
    description: "Find temples near you with PIN-code based search and detailed information.",
    color: "bg-secondary",
  },
];

const institutionFeatures = [
  {
    icon: Users,
    title: "Devotee Management",
    description: "Manage bookings, donations, and devotee engagement efficiently.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance with detailed insights and reports.",
  },
  {
    icon: Truck,
    title: "Logistics Automation",
    description: "Automated shipping labels, tracking, and delivery management.",
  },
  {
    icon: CreditCard,
    title: "Payment Settlement",
    description: "Secure Razorpay integration with split settlements.",
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-lotus opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-3 mb-4">
            Everything You Need for Your{" "}
            <span className="text-gradient-sacred">Spiritual Journey</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete platform designed to enhance your connection with sacred places
          </p>
        </motion.div>

        {/* Features grid - For Devotees */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* For Institutions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          id="temples"
          className="bg-gradient-sacred rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="text-center mb-10">
              <span className="text-primary-foreground/80 font-medium text-sm uppercase tracking-wider">
                For Temples & Institutions
              </span>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-primary-foreground mt-3 mb-4">
                Powerful Tools to Grow Your Reach
              </h3>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                Everything you need to manage your temple digitally and connect with devotees worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {institutionFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 border border-primary-foreground/20"
                >
                  <feature.icon className="w-8 h-8 text-primary-foreground mb-3" />
                  <h4 className="font-semibold text-primary-foreground mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-primary-foreground/70">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
