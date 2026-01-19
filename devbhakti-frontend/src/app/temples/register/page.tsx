"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion"
import Footer from "@/components/landing/Footer"
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button"
import { Sparkles, Building2, Calendar, Search, Users, ShieldCheck, ArrowRight, X, Info, Smartphone, Globe, Tv, Gift, LayoutDashboard, CheckCircle2, Heart, Star, Hand, Lamp, Bell, Play, Volume2, Eye, Flame, Cloud, Sunrise, Moon, Infinity, Zap, Award, TrendingUp, Clock, Shield, BookOpen, ChevronRight } from "lucide-react"
import TempleRegistrationForm from "@/components/temples/TempleRegistrationForm"
import Image from "next/image"
import heroTempleImage from "@/assets/hero-temple.jpg"



import templeIcon from "@/assets/icons/temple-icon.png";
import pujaIcon from "@/assets/icons/puja.png";
import diyaIcon from "@/assets/icons/diya.png";
import offeringIcon from "@/assets/icons/pray.png";
import prasadIcon from "@/assets/icons/ladoo.png";
import donateIcon from "@/assets/icons/donate.png";



export default function RegisterTemplePage() {
    const [showRegistrationModal, setShowRegistrationModal] = useState(false)
    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const heroRef = useRef(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
    const y = useTransform(scrollYProgress, [0, 1], [0, 300])
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    const benefits = [
        {
            title: "Digital Temple Presence",
            desc: "Create a divine digital space for your temple where devotees can connect from anywhere in the world.",
            image: "https://www.poojn.in/wp-content/uploads/2025/03/Ram-Mandir-in-the-Digital-Age-Websites-Live-Streams-and-Virtual-Tours-Enhance-Devotion.jpeg.jpg",
            icon: Building2,
            color: "from-amber-500 to-orange-600"
        },
        {
            title: "Sacred Rituals Booking",
            desc: "Allow devotees to book special poojas, abhishekams, and homams online with just a few clicks.",
            image: "https://static.vecteezy.com/system/resources/previews/073/751/930/non_2x/two-men-perform-ritual-at-rural-setting-around-decorated-fire-green-field-in-background-free-photo.jpg",
            icon: Calendar,
            color: "from-orange-600 to-red-600"
        },
        {
            title: "Divine Offerings",
            desc: "Receive donations and offerings digitally, allowing devotees to contribute to your temple's growth.",
            image: "https://static.vecteezy.com/system/resources/previews/016/283/247/non_2x/lakshmi-puja-in-diwali-is-a-hindu-occasion-for-the-veneration-of-laxmi-the-goddess-of-prosperity-free-photo.jpg",
            icon: Gift,
            color: "from-red-600 to-pink-600"
        },
        {
            title: "Live Divine Darshan",
            desc: "Stream daily aartis, special ceremonies, and festivals to devotees who can't be physically present.",
            image: "https://static.vecteezy.com/system/resources/previews/071/257/862/non_2x/sculptures-of-sri-sita-ram-laxman-free-photo.JPG",
            icon: Tv,
            color: "from-pink-600 to-purple-600"
        },
        {
            title: "Global Devotee Community",
            desc: "Connect with NRIs and devotees worldwide, expanding your temple's spiritual influence globally.",
            image: "https://images.news18.com/ibnlive/uploads/2024/01/religious-tourism-2024-01-c45a2f2f245be86a28c6e012ee8fa2f6-16x9.jpg",
            icon: Globe,
            color: "from-purple-600 to-indigo-600"
        },
        {
            title: "Sacred Mobile Apps",
            desc: "Dedicated Android and iOS apps for your temple, bringing divine blessings to your devotees' fingertips.",
            image: "https://www.poojn.in/wp-content/uploads/2025/05/Pratyabhijna-and-Modern-Spirituality-A-Contemporary-Exploration.jpeg.jpg",
            icon: Smartphone,
            color: "from-indigo-600 to-blue-600"
        }
    ]

    const testimonials = [
        {
            name: "Shri Kashi Vishwanath Mandir",
            role: "Temple Management",
            content: "DevBhakti has revolutionized how we connect with our devotees globally. Our online rituals have seen a 400% increase in participation.",
            avatar: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?q=80&w=2070&auto=format&fit=crop",
            rating: 5
        },
        {
            name: "Tirupati Balaji Temple Trust",
            role: "Priest Council",
            content: "The live streaming feature has brought the divine presence of Lord Venkateswara to millions of homes worldwide.",
            avatar: "data:image/jpeg;base64,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",
            rating: 5
        },
        {
            name: "Siddhivinayak Temple",
            role: "Administration",
            content: "Managing donations and bookings has never been easier. The dashboard is intuitive and saves us hours of work daily.",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop",
            rating: 5
        }
    ]

    const stats = [
        { number: "1000+", label: "Sacred Temples", icon: Building2 },
        { number: "5M+", label: "Devotees Connected", icon: Users },
        { number: "50K+", label: "Daily Rituals", icon: Calendar },
        { number: "24/7", label: "Live Darshan", icon: Eye }
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [testimonials.length])

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-x-hidden">
            <Navbar variant="temple" />
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            <main className="flex-grow relative z-10">
                {/* Hero Section with Parallax Effect - Matching Landing Page Style */}
                <section ref={heroRef} className="relative w-full min-h-screen sm:min-h-[950px] overflow-hidden flex items-center justify-center">
                    {/* Background with Parallax Effect */}
                    <motion.div
                        style={{ y, opacity }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={heroTempleImage}
                            alt="Sacred temple at sunrise"
                            fill
                            priority
                            className="object-cover"
                        />
                        {/* Gradient overlay from main landing page */}
                        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
                    </motion.div>

                    <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-extrabold tracking-tight mb-8 leading-tight text-foreground">
                                <span className="text-primary">Digital Temple</span>
                                <br />
                                <span>Presence</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-black max-w-3xl mx-auto mb-12 leading-relaxed font-light font-sans">
                                Bring the sacred blessings of your temple to devotees across the globe through our spiritual platform.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Button
                                    size="lg"
                                    onClick={() => setShowRegistrationModal(true)}
                                    className="h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm rounded-full font-bold transition-all transform hover:scale-105"
                                >
                                    <Image src={templeIcon} alt="temple" className="invert brightness-0 mr-3 h-6 w-6" />
                                    Register Your Temple
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Scroll Indicator */}
                    <motion.div
                        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-muted-foreground"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                    </motion.div>
                </section>

                {/* Stats Section with Modern Design */}
                {/* <section className="py-20 bg-card/50 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">Our Divine Impact</h2>
                            <div className="w-32 h-1.5 bg-gradient-sacred mx-auto rounded-full"></div>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="text-center group"
                                >
                                    <div className="bg-background/50 backdrop-blur-md rounded-2xl p-6 border border-border group-hover:bg-background/80 transition-all duration-300 transform hover:-translate-y-2 shadow-soft">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform text-primary">
                                            <stat.icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-4xl md:text-5xl font-bold text-foreground font-serif mb-2">
                                            {stat.number}
                                        </div>
                                        <div className="text-muted-foreground font-medium">
                                            {stat.label}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section> */}

                {/* Introduction Section with Split Design */}
                <section className="py-24 bg-background relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7 }}
                                viewport={{ once: true }}
                            >
                                <div className="relative">
                                    <img
                                        src="https://plus.unsplash.com/premium_photo-1661963629241-52c812d5c7f8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                        alt="Temple Priest"
                                        className="rounded-2xl shadow-elevated"
                                    />
                                    <div className="absolute -bottom-6 -right-6 bg-card rounded-2xl p-6 shadow-warm border border-border">
                                        <div className="text-3xl font-bold text-primary font-serif">10+</div>
                                        <div className="text-sm text-foreground">Years of Divine Service</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl font-bold font-serif text-foreground mb-6">Bridging Ancient Traditions With Modern Technology</h2>
                                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                    DevBhakti is a sacred digital platform that honors our ancient traditions while embracing modern technology.
                                    We empower temples to connect with devotees globally, allowing the divine blessings to reach every corner of the world.
                                </p>

                                <div className="space-y-4 mb-8">
                                    {[
                                        { icon: CheckCircle2, text: "Easy Setup in Minutes" },
                                        { icon: Shield, text: "Secure & Reliable Platform" },
                                        { icon: Clock, text: "Transparent Processing" },
                                        { icon: TrendingUp, text: "Grow Your Temple's Reach" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-foreground font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => setShowRegistrationModal(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-8"
                                >
                                    Get Started Today
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Key Benefits with Animated Cards */}
                <section className="py-24 bg-muted/30 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">Divine Benefits For Your Temple</h2>
                            <div className="w-32 h-1.5 bg-gradient-sacred mx-auto rounded-full"></div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 * index }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    whileHover={{ y: -10 }}
                                    className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-warm transition-all duration-500 border border-border"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <img
                                            src={benefit.image}
                                            alt={benefit.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t ${benefit.color} opacity-0 group-hover:opacity-70 transition-opacity duration-500`}></div>
                                        {/* <div className="absolute top-4 right-4 w-12 h-12 bg-card rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0 text-primary shadow-soft">
                                            <benefit.icon className="w-6 h-6" />
                                        </div> */}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold font-serif text-foreground mb-3">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            {benefit.desc}
                                        </p>
                                        <div className="flex items-center text-primary font-medium group-hover:text-primary/80 transition-colors cursor-pointer">
                                            <span>Learn More</span>
                                            <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials with Modern Design */}
                <section className="py-24 bg-background relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">Temples Digitised By DevBhakti</h2>
                            <div className="w-32 h-1.5 bg-gradient-sacred mx-auto rounded-full"></div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 * index }}
                                    viewport={{ once: true }}
                                    className="bg-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-soft"
                                >
                                    <div className="flex items-center mb-4">
                                        <img
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-primary/20"
                                        />
                                        <div>
                                            <h4 className="font-bold text-foreground font-serif">{testimonial.name}</h4>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'fill-secondary text-secondary' : 'text-muted'}`} />
                                        ))}
                                    </div>
                                    <p className="text-foreground italic">"{testimonial.content}"</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section with Icon Grid */}
                <section className="py-24 bg-muted/50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">Complete Digital Temple Solution</h2>
                            <div className="w-32 h-1.5 bg-gradient-sacred mx-auto rounded-full"></div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { title: "Temple Website", desc: "Beautiful, mobile-friendly website for your temple", icon: Globe, color: "from-primary to-primary" },
                                { title: "Donation Portal", desc: "Secure platform for receiving donations online", icon: donateIcon,isImage: true, color: "from-primary to-primary" },
                                { title: "Pooja Booking", desc: "Easy booking system for all rituals and ceremonies", icon: diyaIcon, isImage: true, color: "from-primary to-primary" },
                                { title: "Live Streaming", desc: "HD quality streaming of daily aartis and events", icon: offeringIcon, isImage: true,color: "from-primary to-primary" },
                                { title: "Devotee App", desc: "Custom mobile app for Android and iOS", icon: Smartphone, color: "from-primary to-primary" },
                                { title: "Analytics Dashboard", desc: "Insights to grow your temple's digital presence", icon: LayoutDashboard, color: "from-primary to-primary" }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.1 * i }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                    className="bg-card rounded-2xl p-8 hover:shadow-warm transition-all duration-300 group border border-border"
                                >
                                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        {feature.isImage ? (
                                            <Image src={feature.icon as any} alt={feature.title} width={32} height={32} className="w-8 h-8 object-contain brightness-0 invert" />
                                        ) : (
                                            <feature.icon className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold font-serif text-foreground mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section with Split Background */}
                <section className="py-24 relative overflow-hidden mb-20">
                    <div className="absolute inset-0">
                        <Image
                            src={heroTempleImage}
                            alt="Temple Background"
                            fill
                            className="object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm" />
                    </div>

                    <div className="max-w-4xl mx-auto text-center px-4 relative z-10 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary backdrop-blur-md rounded-full mb-6 text-primary-foreground">
                                <Image src={templeIcon} alt="temple icon" className=" invert brightness-0 w-12 h-12" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-6">
                                Join The Divine Digital Revolution
                            </h2>
                            <p className="text-xl text-black mb-10 max-w-2xl mx-auto">
                                Bring your temple's blessings to millions of devotees worldwide with our sacred digital platform.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                                <Button
                                    size="lg"
                                    onClick={() => setShowRegistrationModal(true)}
                                    className="bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-12 h-16 text-xl font-bold transform hover:scale-105 transition-all"
                                >
                                    <Image src={templeIcon} alt="temple icon" className="invert brightness-0 mr-3 h-6 w-6" />
                                    Register Your Temple Now
                                </Button>
                            </div>

                            <div className="flex justify-center gap-8 text-sm text-black/80">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-black" />
                                    <span>Free to Join</span>
                                </div>
                                <div className="flex items-center gap-2 text-black">
                                    <CheckCircle2 className="w-5 h-5 text-black" />
                                    <span>Easy Setup</span>
                                </div>
                                <div className="flex items-center gap-2 text-black">
                                   <CheckCircle2 className="w-5 h-5 text-black" />
                                    <span>Dedicated Support</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Registration Modal with Enhanced Animation */}
            <AnimatePresence>
                {showRegistrationModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                        {/* Backdrop with Gradient */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setShowRegistrationModal(false)}
                        />

                        {/* Modal Content with 3D Effect */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, rotateX: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: 100, rotateX: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl max-h-[90vh] z-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                            style={{ perspective: "1000px" }}
                        >
                            <TempleRegistrationForm onClose={() => setShowRegistrationModal(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}