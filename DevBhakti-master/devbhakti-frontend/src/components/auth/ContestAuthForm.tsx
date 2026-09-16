"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Users,
  Trophy,
  Phone,
  Key,
  Loader2,
} from "lucide-react";
import Logo from "@/components/icons/Logo";
import { CountryCodePicker } from "@/components/auth/AuthForm";
import { sendOTP, verifyOTP, checkPhoneOnly } from "@/api/authController";
import { isSequentialOrRepetitive } from "@/utils/textUtils";
import { clearAllTokens } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-temple.jpg";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export default function ContestAuthForm({ slug = "maza-ganesha" }: { slug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || `/campaigns/${slug}/participate`;
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rawDigits = phone.replace(/\D/g, "");
      const normalizedPhone = countryCode + rawDigits;

      if (rawDigits.length < 7 || rawDigits.length > 15) {
        toast({ title: "Invalid Phone", description: "Please enter a valid mobile number.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (isSequentialOrRepetitive(rawDigits)) {
        toast({ title: "Invalid Phone", description: "Phone number looks invalid.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if user is existing or new
      const checkRes = await checkPhoneOnly(normalizedPhone);
      if (checkRes.isNewUser && !isRegisterMode) {
        setIsRegisterMode(true);
      }

      const TEST_MOBILE = "9999999999";
      if (normalizedPhone === TEST_MOBILE) {
        setShowOtpInput(true);
        setDevOtp("123456");
        setResendTimer(60);
        setLoading(false);
        return;
      }

      const res = await sendOTP({
        phone: normalizedPhone,
        name: isRegisterMode && name ? name : undefined,
        role: "DEVOTEE",
        mode: isRegisterMode ? "register" : "login",
      });

      setShowOtpInput(true);
      if (res.data?.otp) {
        setDevOtp(res.data.otp);
      }
      setResendTimer(60);
    } catch (err: any) {
      toast({
        title: "Error Sending OTP",
        description: err.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rawDigits = phone.replace(/\D/g, "");
    const normalizedPhone = countryCode + rawDigits;

    try {
      const TEST_MOBILE = "9999999999";
      const TEST_OTP = "123456";

      if (normalizedPhone === TEST_MOBILE && otp === TEST_OTP) {
        clearAllTokens();
        const dummyUser = {
          id: "dev-user",
          name: name || "Devotee",
          phone: "9999999999",
          role: "DEVOTEE",
          isVerified: true,
        };
        localStorage.setItem("token", "dummy-dev-token");
        localStorage.setItem("user", JSON.stringify(dummyUser));
        window.dispatchEvent(new Event("user-auth-changed"));

        toast({ title: "Login Successful 🎉", description: "Proceeding to contest form...", variant: "success" });
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 800);
        return;
      }

      const res = await verifyOTP(normalizedPhone, otp, "DEVOTEE");
      clearAllTokens();
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("user-auth-changed"));

      toast({ title: "Welcome to Maza Ganesha Contest! 🙏", description: "Directing you to submission form...", variant: "success" });

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);
    } catch (err: any) {
      toast({
        title: "OTP Verification Failed",
        description: err.response?.data?.message || "Invalid OTP code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    try {
      const normalizedPhone = countryCode + phone.replace(/\D/g, "");
      await sendOTP({ phone: normalizedPhone, role: "DEVOTEE", mode: isRegisterMode ? "register" : "login" });
      setResendTimer(60);
      toast({ title: "OTP Resent", description: "A new OTP code has been sent to your phone.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Resend Failed", description: err.response?.data?.message || "Failed to resend OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-y-auto bg-white font-sans py-4 sm:py-8">
      {/* Full Page Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBg.src})`,
          filter: "brightness(0.7) blur(2px)",
        }}
      />

      {/* Subtle Mesh Gradient Overlay */}
      <div className="fixed inset-0 z-[1] bg-white/30 backdrop-blur-[1px]" />

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[2]">
        <div className="absolute top-[10%] -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[10%] -right-48 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-[150px] opacity-30" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative z-10 w-full my-auto">
        {/* Main Form Center Card Container (Increased Width & Adaptive Mobile Padding) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[520px] bg-[#fdfbf7] rounded-3xl sm:rounded-[2.5rem] p-4 xs:p-5 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-amber-200/50 relative z-20 text-center text-[#3d1a10] my-auto"
        >
          {/* Back Button Container matching AuthForm */}
          <div className="w-full flex justify-start mb-1 sm:mb-2 -mt-1">
            <button
              onClick={() => router.push(`/campaigns/${slug}`)}
              className="group flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-primary transition-all text-xs sm:text-sm font-medium cursor-pointer"
            >
              <div className="p-1.5 sm:p-2 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-all border border-slate-200 group-hover:border-primary/30">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              Back to Home
            </button>
          </div>

          {/* Logo at Top */}
          <div className="flex justify-center mb-1.5 sm:mb-2">
            <Logo size="lg" className="drop-shadow-sm scale-90 sm:scale-100" />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              OFFICIAL CONTEST BRANDING LOGO IMAGE & SUBTITLE
          ══════════════════════════════════════════════════════════════ */}
          <div className="mb-4 sm:mb-5 flex flex-col items-center justify-center">
            {/* Official Maza Ganesha Logo Image */}
            <div className="relative w-full max-w-[240px] xs:max-w-[290px] sm:max-w-[360px] h-auto my-0.5 sm:my-1">
              <Image
                src="/maza-ganesha-logo.png"
                alt="Maza Ganesha Photo Contest"
                width={700}
                height={280}
                priority
                className="w-full h-auto object-contain drop-shadow-xs"
              />
            </div>

            {/* Subheading */}
            <p className="text-[11px] xs:text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-1 sm:mt-2">
              Share your Ganpati decoration <br />
              and stand a chance to <span className="text-[#a81d11] font-black">win exciting prizes!</span>
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              3 FEATURE PILLARS WITH VERTICAL DIVIDERS MATCHING IMAGE 2
          ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-3 mb-4 sm:mb-6 text-center border-y border-amber-200/60 py-2.5 sm:py-4 gap-0.5 sm:gap-1">
            {/* Pillar 1 */}
            <div className="flex flex-col items-center px-0.5 sm:px-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fbf1e5] border border-amber-200/60 text-[#88542B] flex items-center justify-center mb-1 sm:mb-2 shadow-xs">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#88542B]" />
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-[#3d1a10] leading-tight sm:leading-snug">
                Upload <br /> Your Photo
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-center px-0.5 sm:px-1 border-x border-amber-200/70">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fbf1e5] border border-amber-200/60 text-[#88542B] flex items-center justify-center mb-1 sm:mb-2 shadow-xs">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#88542B]" />
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-[#3d1a10] leading-tight sm:leading-snug">
                Share with <br /> Family &amp; Friends
              </span>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col items-center px-0.5 sm:px-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fbf1e5] border border-amber-200/60 text-[#88542B] flex items-center justify-center mb-1 sm:mb-2 shadow-xs">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#88542B]" />
              </div>
              <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-[#3d1a10] leading-tight sm:leading-snug">
                Win <br /> Exciting Prizes
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              FORM CONTAINER MATCHING IMAGE 2
          ══════════════════════════════════════════════════════════════ */}
          {!showOtpInput ? (
            <form onSubmit={handleSendOTP} className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg sm:text-2xl text-[#3d1a10] mb-0.5">
                  Ready to participate?
                </h3>
                <p className="text-slate-500 text-[11px] sm:text-sm font-medium mb-3 sm:mb-4">
                  Enter your mobile number to continue
                </p>
              </div>

              {isRegisterMode && (
                <div className="mb-2 sm:mb-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#88542B] shadow-xs"
                  />
                </div>
              )}

              {/* Pill-shaped Mobile Input Box */}
              <div className="flex items-center bg-white border border-slate-200/90 rounded-full px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xs focus-within:border-[#88542B] focus-within:ring-2 focus-within:ring-[#88542B]/10 transition-all">
                <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 shrink-0 mr-1 sm:mr-1.5" />
                <CountryCodePicker value={countryCode} onChange={setCountryCode} />
                <span className="text-slate-300 font-light mx-1.5 sm:mx-2">|</span>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  placeholder="XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-800 tracking-wider placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Gradient CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#4a1306] via-[#8d5020] to-[#cc8b34] hover:from-[#350c03] hover:to-[#b07425] text-white font-black text-xs sm:text-base shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Continue to Participate <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Sign In Link matching Image 2 */}
              <p className="text-[11px] sm:text-xs text-slate-500 pt-1 sm:pt-2 font-medium">
                Already have a DevBhakti account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[#a81d11] font-bold underline hover:text-[#68180d] transition-colors cursor-pointer ml-1"
                >
                  {isRegisterMode ? "Sign In" : "Sign In"}
                </button>
              </p>
            </form>
          ) : (
            /* ══════════════════════════════════════════════════════════════
               OTP VERIFICATION STEP
            ══════════════════════════════════════════════════════════════ */
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg sm:text-xl text-[#3d1a10] mb-0.5">
                  Enter Verification Code
                </h3>
                <p className="text-slate-500 text-xs font-medium">
                  OTP sent to <span className="font-bold text-slate-800">{countryCode} {phone}</span>
                </p>
              </div>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-center shadow-xs">
                  <p className="text-slate-600 text-xs font-semibold">Testing Dev OTP Code:</p>
                  <p className="text-2xl font-serif font-black text-[#88542B] tracking-widest mt-0.5">
                    {devOtp}
                  </p>
                </div>
              )}

              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-center font-mono font-black text-xl tracking-[0.6em] text-slate-800 focus:outline-none focus:border-[#88542B] shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#4a1306] via-[#8d5020] to-[#cc8b34] hover:from-[#350c03] hover:to-[#b07425] text-white font-black text-sm sm:text-base shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify &amp; Proceed to Contest <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className={`font-semibold ${
                    resendTimer > 0 ? "text-slate-400" : "text-[#88542B] underline cursor-pointer"
                  }`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                >
                  Change Phone
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
