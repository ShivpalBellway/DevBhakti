"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";


import {
  Calendar,
  ShoppingBag,
  Video,
  Bell,
  CreditCard,
  MapPin,
  Users,
  Truck,
  BarChart3,
  Shield,
  Smartphone,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import templeIcon from "@/assets/icons/temple-icon.png";
import pujaIcon from "@/assets/icons/puja.png";
import diyaIcon from "@/assets/icons/diya.png";
import offeringIcon from "@/assets/icons/pray.png";
import prasadIcon from "@/assets/icons/ladoo.png";
import donateIcon from "@/assets/icons/donate.png";


import poojaBooking from "@/assets/features/poojaBooking.png";
import liveDarshan from "@/assets/features/livedarshan2.png";
import devotionalProducts from "@/assets/features/products2.png";
import easyDonation from "@/assets/features/donation.png";
import prasadDelivery from "@/assets/features/prasadDelivery.png";
import templeDiscovery from "@/assets/features/templeDiscovery.png";




// Using high-quality Unsplash images that fit the Indian Spiritual theme
const getImageUrl = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const features = [
  {
    icon: diyaIcon,
    isImage: true,
    title: "Easy Pooja Booking",
    description:
      "Schedule special Abhishekams and Archana online. Receive SMS & WhatsApp confirmations instantly.",
    image: poojaBooking,
    accent: "text-orange-600",
  },
  {
    icon: offeringIcon,
    isImage: true,
    title: "Live Darshan",
    description:
      "Join the Aarti from home with crystal clear streaming. Never miss a festival celebration.",
    image: liveDarshan,
    accent: "text-red-600",
  },
  {
    icon: pujaIcon,
    isImage: true,
    title: "Devotional Products",
    description:
      "Order authentic Puja kits, Rudraksha, and Brass idols. Vastu compliant items delivered to you.",
    image: devotionalProducts,
    accent: "text-yellow-600",
  },
  {
    icon: donateIcon,
    isImage: true,
    title: "Easy Donation",
    description:
      "Offer Dakshina directly to the temple fund. Get 80G tax exemption certificates instantly via email.",
    image: easyDonation,
    accent: "text-green-700",
  },
  {
    icon: templeIcon,
    isImage: true,
    title: "Temple Discovery",
    description:
      "Find ancient temples, Pandits, and Dharamshalas near you using GPS and Pincode search.",
    image: templeDiscovery,
    accent: "text-purple-700",
  },
  {
    icon: prasadIcon,
    isImage: true,
    title: "Prasad Delivery",
    description:
      "We deliver the 'Charnamrit' and 'Laddu' Prasad from the temple sanctum to your doorstep.",
    image: prasadDelivery,
    accent: "text-orange-500",
  },
];

const institutionFeatures = [
  {
    icon: Users,
    title: "Devotee Management",
    description:
      "Manage bookings, donations, and devotee engagement efficiently.",
    accent: "bg-orange-100 text-orange-800",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance with detailed insights and reports.",
    accent: "bg-red-100 text-red-800",
  },
  {
    icon: Truck,
    title: "Logistics Automation",
    description:
      "Automated shipping labels, tracking, and delivery management.",
    accent: "bg-yellow-100 text-yellow-800",
  },
  {
    icon: CreditCard,
    title: "Payment Settlement",
    description: "Secure Razorpay integration with split settlements.",
    accent: "bg-green-100 text-green-800",
  },
];



const FeaturesSection: React.FC = () => {
  const [dynamicFeatures, setDynamicFeatures] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/cms/features`);
        const activeFeatures = response.data.filter((f: any) => f.active);
        if (activeFeatures.length > 0) {
          setDynamicFeatures(activeFeatures);
        }
      } catch (error) {
        console.error("Error fetching dynamic features:", error);
      }
    };
    fetchFeatures();
  }, []);

  const displayFeatures = dynamicFeatures.length > 0 ? dynamicFeatures : features;

  return (
    <section
      id="features"
      className=" bg-orange-50/50 py-6 md:py-6 relative overflow-hidden"
    >
      {/* Decorative Background Pattern (Mandala style via CSS) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#b45309 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-red-200/40 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          // ... rest of the file using displayFeatures instead of features

          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mt-3 mb-4">
            Everything You Need for Your
            <span className="text-gradient-sacred"> Spiritual Journey</span>
          </h2>
          <p className="text-foreground text-lg">
            A complete platform designed to enhance your connection with sacred
            places
          </p>
        </motion.div>
        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{
                opacity: 0,
                y: 30,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className="group relative h-[300px] rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={
                    feature.image && typeof feature.image === 'string' && (feature.image.startsWith('/') || feature.image.startsWith('http'))
                      ? (feature.image.startsWith('http') ? feature.image : `${BASE_URL}${feature.image}`)
                      : (typeof feature.image === 'string' ? getImageUrl(feature.image) : feature.image)
                  }

                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />{" "}
                {/* Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                {/* Floating Icon Badge */}
                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl group-hover:bg-[#845028] group-hover:border-[#845028] transition-colors duration-300">
                  {dynamicFeatures.length > 0 ? (
                    <img
                      src={feature.icon.startsWith('http') ? feature.icon : `${BASE_URL}${feature.icon}`}
                      alt={feature.title}
                      className="w-6 h-6 object-contain invert brightness-0"
                    />
                  ) : feature.isImage ? (
                    <Image src={feature.icon as any} alt={feature.title} width={24} height={24} className="w-6 h-6 object-contain invert brightness-0" />
                  ) : (
                    (() => {
                      const IconComponent = feature.icon as any;
                      return <IconComponent className="w-6 h-6 text-white" />;
                    })()
                  )}
                </div>

                {/* Text Area */}
                <div className="relative z-10">
                  <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-yellow-400 mb-4 rounded-full" />
                  <h3 className="text-2xl font-serif font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2 group-hover:text-orange-100 transition-colors">
                    {feature.title}{" "}
                  </h3>
                  <p className="text-white text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {feature.description}{" "}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}{" "}
        </div>

        {/* Institutional Features - Redesigned as a Sacred Scroll/Panel */}
        {/*
  Institutional Features - Sacred Scroll / Panel Section

  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="relative"
  >
    <div className="absolute inset-0 border-2 border-orange-200 rounded-[2.5rem] pointer-events-none m-4" />
    
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-50 px-4">
      <Sparkles className="w-6 h-6 text-orange-500" />
    </div>

    <div className="bg-white rounded-[2rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-bl-full -mr-16 -mt-16 z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/3">
          <span className="text-orange-600 font-bold tracking-widest uppercase text-xs">
            For Temples & Mutts
          </span>

          <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-2 mb-6">
            Empower Your Institution Digitally
          </h3>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Join thousands of temples across India going digital.
          </p>

          <button className="bg-gray-900 text-white px-8 py-4 rounded-full">
            Partner With Us
          </button>
        </div>

        <div className="lg:w-2/3 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {institutionFeatures.map((feature) => (
              <div key={feature.title}>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
*/}{" "}
      </div>
    </section>
  );
};

export default FeaturesSection;
