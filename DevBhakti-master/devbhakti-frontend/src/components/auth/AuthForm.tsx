"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, ArrowRight, Building2, Mail, Camera, Key, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Logo from "@/components/icons/Logo";
import { sendOTP, verifyOTP, updateProfile, checkPhoneOnly } from "@/api/authController";
import { isSequentialOrRepetitive } from "@/utils/textUtils";
import { clearAllTokens } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-temple.jpg";
import { useLanguage } from "@/context/LanguageContext";


const countries = [
  { value: "+91", label: "India", flag: "🇮🇳" },
  { value: "+1", label: "USA/Canada", flag: "🇺🇸" },
  { value: "+44", label: "UK", flag: "🇬🇧" },
  { value: "+61", label: "Australia", flag: "🇦🇺" },
  { value: "+971", label: "UAE", flag: "🇦🇪" },
  { value: "+65", label: "Singapore", flag: "🇸🇬" },
  { value: "+60", label: "Malaysia", flag: "🇲🇾" },
  { value: "+977", label: "Nepal", flag: "🇳🇵" },
  { value: "+880", label: "Bangladesh", flag: "🇧🇩" },
  { value: "+94", label: "Sri Lanka", flag: "🇱🇰" },
  { value: "+49", label: "Germany", flag: "🇩🇪" },
  { value: "+33", label: "France", flag: "🇫🇷" },
  { value: "+81", label: "Japan", flag: "🇯🇵" },
  { value: "+86", label: "China", flag: "🇨🇳" },
  { value: "+39", label: "Italy", flag: "🇮🇹" },
  { value: "+7", label: "Russia", flag: "🇷🇺" },
  { value: "+55", label: "Brazil", flag: "🇧🇷" },
  { value: "+27", label: "South Africa", flag: "🇿🇦" },
  { value: "+52", label: "Mexico", flag: "🇲🇽" },
];

export function CountryCodePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const selectedCountry = countries.find((country) => country.value === value) || countries[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-slate-600 font-semibold border-l pl-2 border-slate-200 outline-none hover:text-primary transition-colors text-sm"
        >
          <span className="text-base leading-none">{selectedCountry?.flag}</span>
          <span className="leading-none">{selectedCountry?.value}</span>
          <ChevronsUpDown className="ml-0.5 h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value + country.label}
                  value={country.label + " " + country.value}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2 text-base">{country.flag}</span>
                  {country.label} <span className="text-xs text-slate-400 ml-1">({country.value})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const AuthForm: React.FC = () => {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const initialType = (searchParams.get("type") === "institution" || searchParams.get("type") === "temple") ? "institution" : "devotee";

  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
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
  const [countryCode, setCountryCode] = useState("+91");


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
      const normalizedPhone = countryCode + formData.phone.replace(/\D/g, '');
      const response = await sendOTP({
        phone: normalizedPhone,
        role: "DEVOTEE",
        mode
      });
      setResendTimer(60);
      toast({ 
        title: t('auth.otp_sent_title'), 
        description: t('auth.otp_sent_desc'),
        variant: "success"
      });
    } catch (error: any) {
      toast({
        title: t('auth.otp_failed_title'),
        description: error.response?.data?.message || t('auth.otp_resend_failed'),
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
      const rawDigits = formData.phone.replace(/\D/g, '');
      const normalizedPhone = countryCode + rawDigits;

      // Basic client-side validation before server check
      if (rawDigits.length < 7 || rawDigits.length > 15) {
        toast({ title: t('auth.otp_failed_title'), description: t('auth.invalid_phone'), variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (isSequentialOrRepetitive(rawDigits)) {
        toast({ title: t('auth.otp_failed_title'), description: 'Phone number looks invalid (sequential or repetitive).', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // ✅ Step 1: Pehle check karo bina OTP bheje
      const checkResponse = await checkPhoneOnly(normalizedPhone);
      
      if (checkResponse.isNewUser && mode === "login") {
        // New user hai - Signup mode pe switch karo
        setMode("register");
        toast({
          title: t('auth.welcome_title'),
          description: t('auth.welcome_desc'),
          variant: "success"
        });
        setLoading(false);
        return;
      }

      const TEST_MOBILE = "9999999999";
      if (normalizedPhone === TEST_MOBILE) {
        setShowOtpInput(true);
        setDevOtp("123456");
        setResendTimer(60);
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
        title: t('auth.otp_failed_title'),
        description: error.response?.data?.message || t('auth.otp_send_failed'),
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
    const normalizedPhone = countryCode + formData.phone.replace(/\D/g, '');
    try {
      const TEST_MOBILE = "9999999999";
      const TEST_OTP = "123456";

      if (normalizedPhone === TEST_MOBILE && otp === TEST_OTP) {
        // Direct login
        clearAllTokens();

        localStorage.setItem("token", "dummy-dev-token");
        localStorage.setItem("user", JSON.stringify({ 
          id: "dev-user", 
          name: "Test Devotee", 
          phone: "9999999999", 
          role: "DEVOTEE",
          isVerified: true
        }));

        toast({
          title: t('auth.login_success'),
          description: "Developer login successful",
          variant: "success"
        });

        const redirect = searchParams.get("redirect");

        setTimeout(() => {
          if (redirect) {
            window.location.href = redirect;
          } else {
            window.location.href = "/";
          }
        }, 1000);

        return;
      }

      const response = await verifyOTP(normalizedPhone, otp, "DEVOTEE");

      // Clear any previous session metadata across all panels
      clearAllTokens();

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.dispatchEvent(new Event("user-auth-changed"));


      // If there's a profile image, upload it now
      if (profileImage) {
        const imageFormData = new FormData();
        imageFormData.append("profileImage", profileImage);
        await updateProfile(imageFormData);
      }

      toast({
        title: t('auth.login_success'),
        description: t('auth.login_success_desc'),
        variant: "success"
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
        title: t('auth.otp_error_title'),
        description: error.response?.data?.message || t('auth.otp_invalid'),
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
                {t('auth.back_to_home')}
              </button>
            </div>

            <Link href="/" className="transition-transform hover:scale-105 duration-500 cursor-pointer mb-1">
              <Logo size="xl" className="drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight">
              {mode === "login" ? t('auth.welcome_back') : t('auth.begin_journey')}
            </h1>
            <p className="text-base text-slate-500 font-light">
              {mode === "login" ? t('auth.sign_in_subtitle') : t('auth.register_subtitle')}
            </p>
          </div>

          {/* Form */}
          {!showOtpInput ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {mode === "register" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-slate-700 text-xs ml-1 font-medium">{t('auth.full_name')}</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          placeholder={t('auth.your_name')}
                          value={formData.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^[A-Za-z\s]*$/.test(value)) {
                              setFormData({ ...formData, name: value });
                            }
                          }}
                          className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 rounded-lg focus:ring-primary/20 focus:border-primary transition-all text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-slate-700 text-xs ml-1 font-medium">{t('auth.email_optional')}</Label>
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
                <Label htmlFor="phone" className="text-slate-700 text-xs ml-1 font-medium">{t('auth.phone_number')}</Label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <div className="flex items-center gap-2 pl-2.5 pr-2 py-1 border-r border-slate-200 shrink-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <CountryCodePicker value={countryCode} onChange={setCountryCode} />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="XXXXX XXXXX"
                    maxLength={15}
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: val })
                    }}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-2 text-slate-900 placeholder:text-slate-400 text-sm font-medium tracking-wider w-full"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="sacred" className="w-full h-12 rounded-xl text-base font-bold shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.01]" disabled={loading}>
                {loading 
                  ? t('auth.processing')
                  : (mode === "login" ? t('auth.send_otp') : t('auth.begin_my_journey'))}
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
                  <p className="text-slate-600 text-sm font-medium mb-1">{t('auth.dev_otp')}</p>
                  <p className="text-3xl font-serif font-bold text-primary tracking-widest">{devOtp}</p>
                </motion.div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-slate-700 ml-1">{t('auth.enter_otp')}</Label>
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
                    {t('auth.otp')} <span className="text-slate-700 font-medium">{countryCode} {formData.phone}</span> {t('auth.otp_sent_to')}
                  </p>
                </div>

                <Button type="submit" variant="sacred" className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                  {loading ? t('auth.verifying') : t('auth.verify_sign_in')}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>

                <div className="flex flex-col items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                    className={`text-sm font-semibold transition-colors ${resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-primary hover:text-primary/80"}`}
                  >
                    {resendTimer > 0
                      ? `${resendTimer}${t('auth.resend_otp_in_suffix')}`
                      : t('auth.resend_otp')}
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
                    {t('auth.change_phone')}
                  </button>
                </div>
              </div>
            </form>
          )}




          {/* Toggle Mode */}
          <div className="text-center mt-6 pb-2">
            <p className="text-sm text-slate-500">
              {mode === "login" ? t('auth.new_to_devbhakti') : t('auth.already_on_journey')}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary font-bold hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                {mode === "login" ? t('auth.sign_up_now') : t('auth.sign_in')}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthForm;
