"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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

// Using high-quality Unsplash images that fit the Indian Spiritual theme
const getImageUrl = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const features = [
  {
    icon: Calendar,
    title: "Easy Pooja Booking",
    description:
      "Schedule special Abhishekams and Archana online. Receive SMS & WhatsApp confirmations instantly.",
    image: "1680491024867-1a5768225dac", // Kerala Temple architecture
    accent: "text-orange-600",
  },
  {
    icon: Video,
    title: "Live Darshan",
    description:
      "Join the Aarti from home with crystal clear streaming. Never miss a festival celebration.",
    image: "1763186534248-d0de60fd81e2", // Hands with OM/Shiva
    accent: "text-red-600",
  },
  {
    icon: ShoppingBag,
    title: "Devotional Products",
    description:
      "Order authentic Puja kits, Rudraksha, and Brass idols. Vastu compliant items delivered to you.",
    image: "1742632986715-8795748fb43c",
    // Diya/Light
    // https://images.unsplash.com/photo-1742632986715-8795748fb43c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
    accent: "text-yellow-600",
  },
  {
    icon: IndianRupee,
    title: "Easy Donation",
    description:
      "Offer Dakshina directly to the temple fund. Get 80G tax exemption certificates instantly via email.",
    image: "1759591583288-9f5402d76469",
    // Offering coins
    // https://images.unsplash.com/photo-1759591583288-9f5402d76469?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
    accent: "text-green-700",
  },
  {
    icon: MapPin,
    title: "Temple Discovery",
    description:
      "Find ancient temples, Pandits, and Dharamshalas near you using GPS and Pincode search.",
    image: "1709308519878-463dc80d5824", // Temple Gopuram/Tower
    accent: "text-purple-700",
  },
  {
    icon: Truck,
    title: "Prasad Delivery",
    description:
      "We deliver the 'Charnamrit' and 'Laddu' Prasad from the temple sanctum to your doorstep.",
    image: "1758910536889-43ce7b3199fd",
    // Sweets/Prasad
    // https://images.unsplash.com/photo-1758910536889-43ce7b3199fd?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
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
  return (
    <section
      id="features"
      className=" bg-orange-50/50 relative overflow-hidden"
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
            <span className="text-gradient-sacred">Spiritual Journey</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete platform designed to enhance your connection with sacred
            places
          </p>
        </motion.div>
        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
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
              className="group relative h-[200px] rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={getImageUrl(feature.image)}
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
                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Text Area */}
                <div className="relative z-10">
                  <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-yellow-400 mb-4 rounded-full" />
                  <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-orange-100 transition-colors">
                    {feature.title}{" "}
                  </h3>
                  <p className="text-gray-300 text-sm ">
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
