"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, ArrowRight, Building2, Mail, Camera, Key, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/icons/Logo";
import { sendOTP, verifyOTP, updateProfile, checkPhoneOnly } from "@/api/authController";
import { clearAllTokens } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-temple.jpg";


const AuthForm: React.FC = () => {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const initialType = (searchParams.get("type") === "institution" || searchParams.get("type") === "temple") ? "institution" : "devotee";

  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [userType, setUserType] = useState<"devotee" | "institution">(initialType);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    try {
      const normalizedPhone = formData.phone.replace(/\D/g, '');
      const response = await sendOTP({
        phone: normalizedPhone,
        role: "DEVOTEE",
        mode
      });
      setResendTimer(60); // 60 seconds cooldown
      toast({ title: "OTP Sent", description: "A new OTP has been sent to your phone." });
    } catch (error: any) {
      toast({
        title: "OTP Failed",
        description: error.response?.data?.message || "Failed to resend OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedPhone = formData.phone.replace(/\D/g, '');
      
      // ✅ Step 1: Pehle check karo bina OTP bheje
      const checkResponse = await checkPhoneOnly(normalizedPhone);
      
      if (checkResponse.isNewUser && mode === "login") {
        // New user hai - Signup mode pe switch karo
        setMode("register");
        toast({
          title: "Welcome to DevBhakti!",
          description: "Please fill your name to create an account.",
        });
        setLoading(false);
        return;
      }
      
      // ✅ Step 2: Ab OTP bhejo
      const response = await sendOTP({
        phone: normalizedPhone,
        name: mode === "register" ? formData.name : undefined,
        email: mode === "register" && formData.email ? formData.email : undefined,
        role: "DEVOTEE",
        mode
      });
      setShowOtpInput(true);
      if (response.data?.otp) {
        setDevOtp(response.data.otp);
      }
      setResendTimer(60);
    } catch (error: any) {
      toast({
        title: "OTP Failed",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Strip spaces/hyphens for cleaner transmission
    const normalizedPhone = formData.phone.replace(/\D/g, '');
    try {
      const response = await verifyOTP(normalizedPhone, otp, "DEVOTEE");

      // Clear any previous session metadata across all panels
      clearAllTokens();

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));


      // If there's a profile image, upload it now
      if (profileImage) {
        const imageFormData = new FormData();
        imageFormData.append("profileImage", profileImage);
        await updateProfile(imageFormData);
      }

      toast({
        title: "Login Successful",
        description: `Welcome back to DevBhakti!`,
      });

      const redirect = searchParams.get("redirect");

      setTimeout(() => {
        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = "/";
        }
      }, 1000);

    } catch (error: any) {
      toast({
        title: "OTP Error",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Full Page Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBg.src})`,
          filter: 'brightness(0.7) blur(2px)'
        }}
      />

      {/* Subtle Mesh Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-white/30 backdrop-blur-[1px]" />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        <div className="absolute top-[10%] -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[10%] -right-48 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-[150px] opacity-30" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-xl bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        >
          {/* Back Button and Logo Container */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-full flex justify-start mb-6 -mt-2">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 text-slate-500 hover:text-primary transition-all text-sm font-medium"
              >
                <div className="p-2 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-all border border-slate-200 group-hover:border-primary/30">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back to Home
              </button>
            </div>

            <Link href="/" className="transition-transform hover:scale-105 duration-500 cursor-pointer mb-1">
              <Logo size="xl" className="drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight">
              {mode === "login" ? "Welcome Back" : "Begin Your Journey"}
            </h1>
            <p className="text-base text-slate-500 font-light">
              {mode === "login"
                ? "Sign in to continue your spiritual path"
                : "Join the sacred community of DevBhakti"}
            </p>
          </div>

          {/* User Type Toggle (for registration) */}
          {/* {mode === "register" && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
              <button
                onClick={() => setUserType("devotee")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${userType === "devotee"
                  ? "bg-white text-primary shadow-sm scale-[1.01]"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <User className="w-4 h-4" />
                Devotee
              </button>
            </div>
          )} */}

          {/* Form */}
          {!showOtpInput ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {mode === "register" && (
                <>
                  {/* <div className="flex justify-center mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-200 group-hover:border-primary/50 flex items-center justify-center transition-all duration-300 shadow-sm">
                        {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-300 group-hover:text-primary/40 transition-colors">
                            <User className="w-10 h-10 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Photo</span>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-1 right-1 p-1.5 bg-primary rounded-full text-white cursor-pointer shadow-md hover:scale-110 transition-all hover:bg-orange-500 border border-white">
                        <Camera className="w-3.5 h-3.5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-slate-700 text-xs ml-1 font-medium">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg focus:ring-primary/20 focus:border-primary transition-all text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-700 text-xs ml-1 font-medium">Email (Optional)</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-slate-700 text-xs ml-1 font-medium">Phone Number</Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <span className="text-slate-400 font-semibold border-l pl-2 border-slate-200 leading-none group-focus-within:border-primary/30 transition-colors text-sm">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="XXXXX XXXXX"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: val })
                    }}
                    className="pl-20 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium tracking-wider"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="sacred" className="w-full h-12 rounded-xl text-base font-bold shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.01]" disabled={loading}>
                {loading ? "Processing..." : (mode === "login" ? "Send OTP" : "Begin My Journey")}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {devOtp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FDF6F0] border border-orange-100 p-4 rounded-2xl mb-6 text-center shadow-sm"
                >
                  <p className="text-slate-600 text-sm font-medium mb-1">Development OTP</p>
                  <p className="text-3xl font-serif font-bold text-primary tracking-widest">{devOtp}</p>
                </motion.div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-700 ml-1">Enter 6-digit OTP</Label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-16 text-center tracking-[0.8em] font-bold text-2xl rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                  <p className="text-sm text-slate-400 text-center">
                    OTP sent to <span className="text-slate-700 font-medium">+91 {formData.phone}</span>
                  </p>
                </div>

                <Button type="submit" variant="sacred" className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Sign In"}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>

                <div className="flex flex-col items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                    className={`text-sm font-semibold transition-colors ${resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-primary hover:text-primary/80"}`}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium border-b border-slate-200 pb-0.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change Phone Number
                  </button>
                </div>
              </div>
            </form>
          )}




          {/* Toggle Mode */}
          <div className="text-center mt-6 pb-2">
            <p className="text-sm text-slate-500">
              {mode === "login" ? "New to DevBhakti?" : "Already on a journey?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary font-bold hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                {mode === "login" ? "Sign up now" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthForm;
