"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, ArrowRight, Building2, Mail, Camera, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/icons/Logo";
import { sendOTP, verifyOTP, updateProfile } from "@/api/authController";

import { useRouter } from "next/navigation";


const AuthForm: React.FC = () => {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const initialType = searchParams.get("type") === "institution" ? "institution" : "devotee";

  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [userType, setUserType] = useState<"devotee" | "institution">(initialType);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState(""); // For development
  const [loading, setLoading] = useState(false);

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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app with profile image during register, we might need to upload it after verification 
      // or send as multipart if backend supports it in send-otp. 
      // For now, let's just send basic info.
      const response = await sendOTP({
        phone: formData.phone,
        name: mode === "register" ? formData.name : undefined,
        email: mode === "register" && formData.email ? formData.email : undefined
      });
      setShowOtpInput(true);
      if (response.otp) {
        setReceivedOtp(response.otp);
      }



    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await verifyOTP(formData.phone, otp);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // If there's a profile image, upload it now
      if (profileImage) {
        const imageFormData = new FormData();
        imageFormData.append("profileImage", profileImage);
        await updateProfile(imageFormData);
      }

      alert("Login successful!");
      router.push("/");

    } catch (error: any) {
      alert(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <Logo size="lg" />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {mode === "login" ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue your spiritual journey"
                : "Join DevBhakti and connect with sacred temples"}
            </p>
          </div>

          {/* User Type Toggle (for registration) */}
          {mode === "register" && (
            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
              <button
                onClick={() => setUserType("devotee")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${userType === "devotee"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <User className="w-4 h-4" />
                Devotee
              </button>
              {/* <button
                onClick={() => setUserType("institution")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${userType === "institution"
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Building2 className="w-4 h-4" />
                Temple
              </button> */}
            </div>
          )}

          {/* Form */}
          {!showOtpInput ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {mode === "register" && (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-primary/20 flex items-center justify-center">
                        {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="sacred" size="lg" className="w-full" disabled={loading}>
                {loading ? "Processing..." : (mode === "login" ? "Send OTP" : "Create Account & Send OTP")}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {receivedOtp && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="text-sm font-medium text-primary">
                    Development OTP: <span className="text-lg font-bold tracking-widest">{receivedOtp}</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">

                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-10 text-center tracking-[0.5em] font-bold text-xl"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  OTP sent to {formData.phone}
                </p>
              </div>

              <Button type="submit" variant="sacred" size="lg" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP & Sign In"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </Button>

              <button
                type="button"
                onClick={() => setShowOtpInput(false)}
                className="w-full text-sm text-primary hover:underline"
              >
                Change Phone Number
              </button>
            </form>
          )}


          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex justify-center">
            <Button variant="outline" className="w-full max-w-sm">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          {/* Toggle Mode */}
          <p className="text-center mt-8 text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

        </motion.div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-sacred relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-center p-12 w-full">
          <div className="text-center text-primary-foreground max-w-lg">
            <div className="text-8xl mb-8 text-black"> 🕉</div>
            {/* 🕉️ */}
            <h2 className="text-3xl font-serif font-bold mb-4">
              Experience Divine Connections
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Join thousands of devotees discovering temples, booking poojas,
              and experiencing live darshan from sacred places across India.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              {[
                { value: "500+", label: "Temples" },
                { value: "50K+", label: "Devotees" },
                { value: "1M+", label: "Bookings" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-primary-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
