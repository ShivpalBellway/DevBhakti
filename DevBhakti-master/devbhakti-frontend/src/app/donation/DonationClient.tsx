"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import {
    Heart,
    IndianRupee,
    User,
    Phone,
    Mail,
    CheckCircle2,
    Building2,
    Gift,
    ArrowLeft,
    Sparkles,
    FileText,
    ChevronRight,
    ShieldCheck,
    MapPin,
    Search,
    Loader2
} from "lucide-react";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

// Types
interface Temple {
    id: string;
    name: string;
    location: string;
    image?: string;
    deity?: string;
    canDonate?: boolean;
}



const suggestedAmounts = [101, 251, 501, 1100, 2100, 5001, 11000, 21000];
import { fetchPublicTemples, calculateDonationFee } from "@/api/publicController";
import { API_URL } from "@/config/apiConfig";
import axios from "axios";
import { downloadDonationReceipt } from "@/api/userController";
import { notifyFailedPayment } from "@/api/adminController";
import { parseLocalizedValue, isSequentialOrRepetitive } from "@/utils/textUtils";

declare global {
    interface Window {
        Razorpay: any;
    }
}

function DonationForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { language, t: baseT } = useLanguage();
    const t = (key: string) => baseT(`donation.${key}`);

    const [step, setStep] = useState(searchParams.get("temple") ? 2 : 1);
    const [direction, setDirection] = useState(1);

    const [selectedTemple, setSelectedTemple] = useState(searchParams.get("temple") || "");
    const [amount, setAmount] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [is80GRequired, setIs80GRequired] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("upi");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        pan: "",
        address: "",
        message: "",
    });

    const [temples, setTemples] = useState<Temple[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [donatingTo, setDonatingTo] = useState<Temple | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [donationId, setDonationId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [platformFee, setPlatformFee] = useState(0);
    const [totalPayable, setTotalPayable] = useState(0);

    const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

    React.useEffect(() => {
        const loadTemples = async () => {
       
            const data = await fetchPublicTemples({ lang: language });
            setTemples(data);
        };
        loadTemples();

        // Pre-fill from localstorage if available
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setFormData(prev => ({
                ...prev,
                name: parseLocalizedValue(user.name, language) || "",
                phone: (user.phone || "").replace(/\D/g, "").slice(-10),
                email: user.email || "",
            }));
        }
    }, [language]);

    const finalAmount = customAmount || amount;

    const selectedTempleData = temples.find(t => t.id === selectedTemple) || null;

    const nextStep = async () => {
        if (step === 1) {
            if (!selectedTemple) {
                toast({ title: t("toasts.select_temple"), variant: "destructive" });
                return;
            }
            if (selectedTempleData?.canDonate === false) {
                toast({
                    title: "Donations Disabled",
                    description: "Donations are enabled only for verified and active temples.",
                    variant: "destructive"
                });
                return;
            }
            // Check login status
            const token = localStorage.getItem("token");
            if (!token) {
                toast({
                    title: t("toasts.login_title"),
                    description: t("toasts.login_desc"),
                    variant: "destructive"
                });

                // Redirecting to correct /auth path instead of 404 /login
                setTimeout(() => {
                    router.push("/auth?redirect=/donation" + (selectedTemple ? `&temple=${selectedTemple}` : ""));
                }, 1500);
                return;
            }
        }
        if (step === 2 && (!finalAmount || parseFloat(finalAmount) <= 0)) {
            toast({ title: t("toasts.enter_amount"), variant: "destructive" });
            return;
        }
        if (step === 2 && parseFloat(finalAmount) > 10000000) {
            toast({ 
                title: "Limit Exceeded", 
                description: "Maximum donation amount is ₹1 Crore", 
                variant: "destructive" 
            });
            return;
        }
        if (step === 3 && !isAnonymous) {
            const newErrors: Record<string, string> = {};
            const missingFields: string[] = [];

            if (!formData.name.trim()) {
                newErrors.name = "Donar name is required";
                missingFields.push(t("step3.labels.donor_name"));
            }
            if (!formData.phone.trim()) {
                newErrors.phone = "Phone number is required";
                missingFields.push(t("step3.labels.phone_number"));
            } else {
                const rawPhone = formData.phone.trim();
                const hasPlus = rawPhone.startsWith("+");
                const cleanedPhone = rawPhone.replace(/\D/g, "");
                
                if (hasPlus && !cleanedPhone.startsWith("91")) {
                    newErrors.phone = "FCRA restriction: International donations are not accepted.";
                    missingFields.push("Valid Indian Phone Number (+91)");
                } else if (!hasPlus && cleanedPhone.length !== 10) {
                    newErrors.phone = "Phone number must be 10 digits (or include +91)";
                    missingFields.push(t("step3.labels.phone_number") + " (10 digits)");
                } else if (isSequentialOrRepetitive(cleanedPhone)) {
                    newErrors.phone = "Phone number looks invalid (sequential or repetitive)";
                    missingFields.push(t("step3.labels.phone_number") + " (Invalid)");
                }
            }
            if (!formData.email.trim()) {
                newErrors.email = "Email address is required";
                missingFields.push(t("step3.labels.email_address"));
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
                newErrors.email = "Invalid email format";
                missingFields.push(t("step3.labels.email_address") + " (Invalid)");
            }

            if (is80GRequired && !formData.pan) {
                newErrors.pan = "PAN is required for 80G receipt";
                missingFields.push("PAN Number");
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast({ 
                    title: newErrors.phone?.includes("FCRA") ? "FCRA Donation Restriction" : t("toasts.fill_required"), 
                    description: newErrors.phone?.includes("FCRA") ? newErrors.phone : `Missing: ${missingFields.join(", ")}`,
                    variant: "destructive" 
                });
                return;
            }
            
            // Calculate fee before going to step 4
            setLoading(true);
            try {
                const feeData = await calculateDonationFee(parseFloat(finalAmount));
                setPlatformFee(feeData.platformFee);
                setTotalPayable(feeData.totalPayable);
            } catch (err) {
                console.error("Failed to calculate fee", err);
                setPlatformFee(0);
                setTotalPayable(parseFloat(finalAmount));
            }
            setLoading(false);
        }
        setErrors({});

        setDirection(1);
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(step - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmDonation = async () => {
        try {
            if (selectedTempleData?.canDonate === false) {
                toast({
                    title: "Donations Disabled",
                    description: "Donations are enabled only for verified and active temples.",
                    variant: "destructive"
                });
                return;
            }

            setLoading(true);
            setIsPaymentLoading(true);
            const savedUser = localStorage.getItem("user");
            const user = savedUser ? JSON.parse(savedUser) : null;

            // 1. Initiate Donation with Backend
            const initiateRes = await axios.post(`${API_URL}/donations`, {
                templeId: selectedTemple,
                amount: parseFloat(finalAmount),
                donorName: formData.name,
                donorPhone: formData.phone,
                donorEmail: formData.email,
                isAnonymous,
                is80GRequired,
                panNumber: formData.pan,
                address: formData.address,
                message: formData.message,
                userId: user?.id
            }, { validateStatus: () => true });

            const initiateData = initiateRes.data;

            if (!initiateData.success) {
                if (initiateData.message?.includes("token") || initiateRes.status === 401) {
                    toast({ title: t("toasts.session_expired"), description: t("toasts.login_again"), variant: "destructive" });
                } else {
                    toast({ title: t("toasts.initiate_failed"), description: initiateData.message, variant: "destructive" });
                }
                setIsPaymentLoading(false);
                return;
            }

            setDonationId(initiateData.donationId);

            // 2. Open Razorpay Checkout
            const options = {
                key: RAZORPAY_KEY,
                amount: initiateData.order.amount,
                currency: initiateData.order.currency,
                name: "DevBhakti",
                description: t("step4.razorpay_description").replace("{{temple}}", temples.find(t => t.id === selectedTemple)?.name || ""),
                order_id: initiateData.order.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderType: "DONATION",
                            referenceId: initiateData.donationId, // Using donationId as reference
                            orderData: { donationId: initiateData.donationId },
                            userId: user?.id
                        }, { validateStatus: () => true });

                        const verifyData = verifyRes.data;

                        if (verifyData.success) {
                            setTransactionId(response.razorpay_payment_id);
                            setDirection(1);
                            setStep(5); // Success Step
                            toast({
                                title: t("toasts.success_title"),
                                description: verifyData.message || t("toasts.success_desc"),
                                variant: "success"
                            });
                        } else {
                            toast({ title: t("toasts.verification_failed"), description: verifyData.message, variant: "destructive" });
                        }
                    } catch (err: any) {
                        toast({ title: t("toasts.verification_error"), description: err.message, variant: "destructive" });
                    } finally {
                        setIsPaymentLoading(false);
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: { color: "#7c4624" },
                modal: {
                    ondismiss: function () {
                        console.log("Payment modal dismissed");
                        setIsPaymentLoading(false);
                        notifyFailedPayment({
                            orderType: "DONATION",
                            referenceId: initiateData.donationId,
                            phone: formData.phone,
                            userName: formData.name,
                        }).catch(console.error);
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment failed event:", response.error);
                setIsPaymentLoading(false);
                notifyFailedPayment({
                    orderType: "DONATION",
                    referenceId: initiateData.donationId,
                    phone: formData.phone,
                    userName: formData.name,
                    error: response.error
                }).catch(console.error);
            });

            rzp.open();

        } catch (error: any) {
            console.error("Donation Error:", error);
            toast({ title: t("toasts.donation_failed"), description: error.message, variant: "destructive" });
            setIsPaymentLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {isPaymentLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#fdf6e9] px-8 py-7 text-center shadow-2xl border border-[#e6d5c8]">
                        <Loader2 className="h-10 w-10 animate-spin text-[#7c4624]" />
                        <div>
                            <p className="text-lg font-bold text-[#2a1b01]">Loading Payment</p>
                            <p className="mt-1 text-sm text-muted-foreground">Please wait while we confirm your payment.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Replaced orange/amber colors with #7c4624 variants */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c4624]/20 dark:bg-[#7c4624]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7c4624]/20 dark:bg-[#7c4624]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <NextImage
                        src="/images/sacred_donation_hero_bg.png"
                        alt="Sacred Donation"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/95" />
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#7c4624]/15 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10 pt-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-[#7c4624] text-xs font-bold uppercase tracking-[0.2em] border border-[#e6d5c8] shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 fill-[#7c4624]" />
                                <span>{t("hero.tagline")}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground drop-shadow-sm leading-tight">
                                {t("hero.title")} <span className="text-primary italic">{t("hero.title_highlight")}</span>
                            </h1>
                            <p className="text-base md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed font-medium">
                                {t("hero.subtitle")}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div id="donation-steps" className="container mx-auto px-4 py-8 relative z-10">
                {/* Progress Steps */}
                <div className="max-w-6xl mx-auto mb-10">
                    <div className="flex justify-between items-center relative gap-2 sm:gap-4 overflow-x-auto pb-4 sm:pb-0 hide-scrollbar">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full -z-10">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#7c4624] to-[#5a3820] rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((step - 1) / 4) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>

                        {[
                            { num: 1, label: t("steps.temple") },
                            { num: 2, label: t("steps.amount") },
                            { num: 3, label: t("steps.details") },
                            { num: 4, label: t("steps.payment") },
                            { num: 5, label: t("steps.receipt") },
                        ].map((s) => (
                            <div key={s.num} className="flex flex-col items-center gap-2 bg-background p-2 rounded-xl shrink-0">
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${step >= s.num
                                        ? "bg-[#7c4624] border-[#7c4624] text-white shadow-lg shadow-[#7c4624]/20"
                                        : "bg-background border-muted text-muted-foreground"
                                        }`}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                                </motion.div>
                                <span className={`text-xs font-semibold hidden md:block ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait" custom={direction}>

                        {/* Step 1: Select Temple */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-6">
                                    <div className="text-left">
                                        <h2 className="text-3xl font-bold font-display text-[#2a1b01]">{t("step1.title")}</h2>
                                        <p className="text-muted-foreground mt-1">{t("step1.subtitle")}</p>
                                    </div>

                                    {/* Slick Theme-Matching Search Bar */}
                                    <div className="w-full md:w-96 relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7c4624]/20 to-orange-200/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative flex items-center bg-white border border-[#e6d5c8] rounded-2xl shadow-sm overflow-hidden p-1.5 focus-within:border-[#7c4624] focus-within:shadow-md transition-all duration-300">
                                            <div className="flex-1 flex items-center px-3">
                                                <Search className="h-4 w-4 text-[#7c4624] mr-2" />
                                                <input
                                                    type="text"
                                                    placeholder={t("step1.search_placeholder")}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-transparent outline-none py-2 text-sm font-medium placeholder:text-muted-foreground/60"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {temples.length > 0 ? (
                                        temples
                                            .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.location.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((temple) => (
                                                <motion.div
                                                    key={temple.id}
                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`relative p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-300 ${selectedTemple === temple.id
                                                        ? "border-[#7c4624] bg-[#fdf6e9] shadow-lg ring-1 ring-[#e6d5c8]"
                                                        : "border-slate-100 hover:border-[#b08d7a] bg-white shadow-sm"
                                                        }`}
                                                    onClick={() => setSelectedTemple(temple.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl shrink-0 ${selectedTemple === temple.id ? "bg-[#7c4624] text-white" : "bg-slate-50 text-slate-400"}`}>
                                                            <Building2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <h3 className="font-bold text-base text-[#2a1b01] leading-tight truncate">{temple.name}</h3>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-[13px]">
                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                <span className="truncate">{temple.location}</span>
                                                            </div>
                                                        </div>
                                                        {selectedTemple === temple.id && (
                                                            <div className="shrink-0">
                                                                <CheckCircle2 className="w-5 h-5 text-[#7c4624] fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c4624] mx-auto mb-4"></div>
                                            <p className="text-muted-foreground font-medium italic">{t("step1.search_placeholder")}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Amount */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                {/* Amount Selection */}
                                <Card className="border-border/50 shadow-sm overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-[#7c4624] to-[#63361c]" />
                                    <CardContent className="p-6 md:p-8">
                                        {selectedTempleData && (
                                            <div className="text-center mb-4">
                                                <p className="text-sm text-muted-foreground">{t("step2.donation_for") || "Donation For"}</p>
                                                <h3 className="text-xl font-semibold text-[#2a1b01]">{selectedTempleData.name}</h3>
                                                {selectedTempleData.location && <p className="text-sm text-muted-foreground">{selectedTempleData.location}</p>}
                                            </div>
                                        )}

                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                                <IndianRupee className="w-5 h-5 text-[#7c4624]" />
                                                {t("step2.title")}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                                            {suggestedAmounts.map((amt) => (
                                                <Button
                                                    key={amt}
                                                    variant={amount === amt.toString() && !customAmount ? "default" : "outline"}
                                                    className={`h-12 text-lg ${amount === amt.toString() && !customAmount
                                                        ? "bg-[#7c4624] hover:bg-[#63361c] text-white"
                                                        : "hover:border-[#b08d7a] hover:text-[#7c4624]"
                                                        }`}
                                                    onClick={() => {
                                                        setAmount(amt.toString());
                                                        setCustomAmount("");
                                                    }}
                                                >
                                                    ₹{amt.toLocaleString()}
                                                </Button>
                                            ))}
                                        </div>

                                        <div className="relative max-w-xs mx-auto">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-muted-foreground text-lg">₹</span>
                                            </div>
                                            <Input
                                                type="number"
                                                placeholder={t("step2.other_placeholder")}
                                                className="pl-8 text-lg font-semibold h-12 border-[#e6d5c8] focus:border-[#7c4624] focus:ring-[#7c4624]/20"
                                                value={customAmount}
                                                min={0}
                                                max={10000000}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const numericVal = parseFloat(val);
                                                    if (numericVal > 10000000) {
                                                        setCustomAmount("10000000");
                                                        toast({
                                                            title: "Amount Restricted",
                                                            description: "Maximum donation amount is ₹1 Crore",
                                                            variant: "destructive"
                                                        });
                                                    } else if (numericVal < 0) {
                                                        setCustomAmount("0");
                                                    } else {
                                                        setCustomAmount(val);
                                                    }
                                                    setAmount("");
                                                }}
                                            />
                                        </div>

                                        {finalAmount && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-6 p-4 bg-[#f5ebe0] dark:bg-[#7c4624]/30 rounded-xl text-center border border-[#e6d5c8] dark:border-[#7c4624]/50"
                                            >
                                                <p className="text-sm text-muted-foreground mb-1">{t("step2.total_label")}</p>
                                                <p className="text-4xl font-bold text-[#7c4624] dark:text-[#cfa98e] font-display">
                                                    ₹ {parseInt(finalAmount).toLocaleString()}
                                                </p>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Donor Details */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold font-display mb-2">{t("step3.title")}</h2>
                                    <p className="text-muted-foreground">{t("step3.subtitle")}</p>
                                </div>

                                <Card className="border-border/50 shadow-sm">
                                    <CardContent className="p-6 md:p-8 space-y-6">

                                        {!isAnonymous && (
                                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">{t("step3.labels.donor_name")} <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="name"
                                                            placeholder={t("step3.placeholders.name")}
                                                            className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                                                            value={formData.name}
                                                            onChange={(e) => {
                                                                setFormData({ ...formData, name: e.target.value });
                                                                if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                                                            }}
                                                        />
                                                    </div>
                                                    {errors.name && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone">{t("step3.labels.phone_number")} <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="phone"
                                                            placeholder="Phone (e.g. +91 9999999999)"
                                                            className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                                                            value={formData.phone}
                                                            maxLength={16}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                if (val.startsWith("+")) {
                                                                    val = "+" + val.slice(1).replace(/\D/g, "").slice(0, 15);
                                                                } else {
                                                                    val = val.replace(/\D/g, "").slice(0, 10);
                                                                }
                                                                setFormData({ ...formData, phone: val });
                                                                if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                                                            }}
                                                        />
                                                    </div>
                                                    {errors.phone && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.phone}</p>}
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="email">{t("step3.labels.email_address")} <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder={t("step3.placeholders.email")}
                                                            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                                            value={formData.email}
                                                            onChange={(e) => {
                                                                setFormData({ ...formData, email: e.target.value });
                                                                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                                            }}
                                                        />
                                                    </div>
                                                    {errors.email && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.email}</p>}
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="address">{t("step3.labels.address_optional")}</Label>
                                                    <Textarea
                                                        id="address"
                                                        placeholder={t("step3.placeholders.address")}
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        className="resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="message">{t("step3.labels.message")}</Label>
                                            <Textarea
                                                id="message"
                                                placeholder={t("step3.placeholders.message")}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="resize-none bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                                                rows={3}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 4: Payment */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold font-display mb-2">{t("step4.title")}</h2>
                                    <p className="text-muted-foreground">{t("step4.subtitle")}</p>
                                </div>

                                <Card className="border-border/50 shadow-lg overflow-hidden border-t-4 border-t-[#7c4624]">
                                    <CardContent className="p-0">
                                        <div className="p-6 md:p-8 bg-gradient-to-br from-[#f5ebe0] to-white dark:from-zinc-900 dark:to-zinc-950">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                                <div>
                                                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">{t("step4.donating_to")}</p>
                                                    <h3 className="text-xl font-bold">{temples.find(t => t.id === selectedTemple)?.name}</h3>
                                                    <p className="text-sm text-[#7c4624]">{temples.find(t => t.id === selectedTemple)?.location}</p>
                                                </div>
                                                <div className="text-left md:text-right">
                                                    <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Payable</p>
                                                    <p className="text-3xl font-display font-bold text-[#7c4624]">₹ {totalPayable.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm py-6 border-t border-dashed border-[#e6d5c8] dark:border-zinc-800">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Donation Amount</span>
                                                    <span className="font-medium">₹ {parseInt(finalAmount).toLocaleString('en-IN')}</span>
                                                </div>
                                                {platformFee > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Platform Support Fee</span>
                                                        <span className="font-medium">₹ {platformFee.toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}

                                                {!isAnonymous && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">{t("step4.donor")}</span>
                                                            <span className="font-medium">{formData.name}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">{t("step4.email")}</span>
                                                            <span className="font-medium">{formData.email}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {is80GRequired && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{t("step4.receipt_80g")}</span>
                                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> {t("step4.requested_pan").replace("{{pan}}", formData.pan)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="bg-gradient-to-br from-[#fdf6e9] to-white dark:from-zinc-900 dark:to-zinc-950 border border-[#e6d5c8] dark:border-zinc-800 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center space-y-4 shadow-sm">
                                    <h4 className="font-semibold text-xl font-display text-[#2a1b01] text-center">{t("step4.complete_title")}</h4>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">{t("step4.complete_subtitle")}</p>
                                    <Button 
                                        size="lg" 
                                        className="w-full md:w-auto min-w-[280px] h-14 text-lg font-bold bg-[#7c4624] hover:bg-[#63361c] text-white shadow-xl shadow-[#7c4624]/20 transition-all hover:scale-105" 
                                        onClick={handleConfirmDonation} 
                                        disabled={loading}
                                    >
                                        {loading ? t("step4.processing") : `${t("step4.pay_button")} ₹${totalPayable.toLocaleString('en-IN')}`}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
                                        {t("step4.secure_note")}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Success */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-center py-10"
                            >
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in spin-in-3 duration-700">
                                    <Heart className="w-12 h-12 text-green-600 fill-green-600" />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-foreground mb-4">{t("step5.title")}</h2>
                                <div className="max-w-md mx-auto mb-8">
                                    <p className="text-dark text-lg">
                                        {t("step5.thank_you")}, <span className="font-semibold text-dark">{isAnonymous ? t("step5.devotee") : formData.name.split(' ')[0]}</span>.
                                    </p>
                                    <p className="text-dark mt-2">
                                        {t("step5.contribution_received")} <span className="font-bold text-green-600">₹{parseInt(finalAmount).toLocaleString()}</span> {t("step5.has_been_received")}
                                    </p>
                                </div>

                                <div className="bg-muted/30 p-6 rounded-xl max-w-sm mx-auto mb-8 space-y-2 text-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <span className="text-muted-foreground shrink-0">{t("step5.txn_id")}</span>
                                        <span className="font-mono break-all text-right">{transactionId || `TXN${Math.floor(Math.random() * 10000000)}`}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("step5.date")}</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button
                                        onClick={async () => {
                                            if (!donationId) return;
                                            try {
                                                const res = await downloadDonationReceipt(donationId);
                                                if (res.success) {
                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `Donation-Receipt-${donationId.slice(-6)}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                } else {
                                                    toast({
                                                        title: t("toasts.download_failed"),
                                                        description: t("toasts.download_error"),
                                                        variant: "destructive"
                                                    });
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        size="lg"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <FileText className="w-4 h-4 mr-2" /> {t("step5.download_receipt")}
                                    </Button>
                                    <Button asChild size="lg" className="bg-[#7c4624] hover:bg-[#63361c]">
                                        <Link href="/temples">{t("step5.explore_more")}</Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href="/">{t("step5.back_home")}</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Controls */}
                    {step < 5 && (
                        <div className="flex justify-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={prevStep}
                                disabled={step === 1}
                                className={`w-32 ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t("buttons.back")}
                            </Button>

                            {step < 4 && (
                                <Button size="lg" className="px-6 bg-[#7c4624] hover:bg-[#63361c]" onClick={nextStep}>
                                    {t("buttons.continue")} <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default function DonationClient() {
    const { t } = useLanguage();
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-xl text-primary/60 animate-pulse">{t("common.loading")}</div>}>
            <DonationForm />
        </Suspense>
    );
}
