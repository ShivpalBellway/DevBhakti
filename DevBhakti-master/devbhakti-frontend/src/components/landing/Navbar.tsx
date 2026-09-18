"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, User, LogIn, UserPlus, ShoppingBag, ShoppingCart, Church, Search, ArrowRight, LogOut, Heart, Globe } from "lucide-react";
import { BASE_URL, API_URL } from "@/config/apiConfig";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { GlobalSearch } from "./GlobalSearch";
import TempleLoginModal from "@/components/temples/TempleLoginModal";
import { useCart } from "@/context/CartContext";
import { clearAllTokens } from "@/lib/auth-utils";
import CartDrawer from "@/components/marketplace/CartDrawer";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { fetchMandalRegistrationStatus } from "@/api/publicController";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { parseLocalizedValue } from "@/utils/textUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  variant?: "default" | "temple";
  isSolid?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ variant = "default", isSolid = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTempleLoginModal, setShowTempleLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<"temple" | "mandal">("temple");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMandalEnabled, setIsMandalEnabled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);

  // Check if we're on the temple or mandal registration page
  const isTempleRegistrationPage = pathname === '/temples/register';
  const isMandalRegistrationPage = pathname === '/register-mandal';
  const { cartItems, itemCount, updateQuantity, removeFromCart } = useCart();
  const { language, setLanguage, t } = useLanguage();

  const langLabels: Record<Language, string> = { en: 'EN', hi: 'हि', mr: 'म' };
  const langFullNames: Record<Language, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };

  useEffect(() => {
    setMounted(true);
    // Check for user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    const checkMandalStatus = async () => {
      const res = await fetchMandalRegistrationStatus();
      if (res.success && res.enabled) {
        setIsMandalEnabled(true);
      }
    };
    checkMandalStatus();

    const fetchCampaigns = async () => {
      try {
        const res = await fetch(`${API_URL}/campaigns/list-active`);
        const json = await res.json();
        if (json.success && json.data) {
          setActiveCampaigns(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch campaigns", e);
      }
    };
    fetchCampaigns();
    
    const handleAuthChange = () => {
      const updatedUser = localStorage.getItem("user");
      if (updatedUser) {
        try {
          setUser(JSON.parse(updatedUser));
        } catch (e) {}
      } else {
        setUser(null);
      }
    };
    window.addEventListener("user-auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user-auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    clearAllTokens();
    setUser(null);
    window.location.reload();
  };

  const isLinkActive = (href: string) => {
    // Standardize href by removing query params for comparison
    const path = href.split('?')[0];

    if (path === '/') return pathname === '/';
    // Match current path or if it's a sub-path (e.g., /poojas/details matches /poojas)
    return pathname.startsWith(path);
  };


  const baseNavLinks = [
    { label: t('navbar.poojas'), href: "/poojas" },
    { label: t('navbar.temples'), href: "/temples" },
  ];
  
  if (isMandalEnabled) {
    baseNavLinks.push({ label: t('navbar.mandals'), href: "/mandals" });
  }
  
  baseNavLinks.push(
    { label: t('navbar.marketplace'), href: "/marketplace?category=All" },
    { label: t('navbar.live_darshan'), href: "/live-darshan" },
    { label: t('navbar.Donation'), href: "/donation" }
  );
  
  const navLinks = baseNavLinks;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen || isSolid
          ? "bg-background shadow-soft border-b border-border"
          : "bg-background xl:bg-transparent"
          }`}
      >
        <div className="container mx-auto px-4">
          <nav className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-16 md:h-18" : "h-18 md:h-22"} gap-4 md:gap-6`}>
            {/* Logo Section */}
            <div className="flex items-center shrink-0 relative z-10">
              <Link href="/" className="block">
                <Logo
                  className={`h-10 md:h-12 xl:h-14 2xl:h-16 w-auto transition-all duration-300 ${isScrolled ? "scale-90" : "scale-100"
                    }`}
                />
              </Link>

            </div>

            {/* Desktop Navigation & Search (Wide Screens Only) */}
            <div className="hidden lg:flex flex-1 items-center justify-between gap-2 xl:gap-4 2xl:gap-8 mx-1 lg:mx-2 xl:mx-4">
              {/* Desktop Search Bar */}
              {!isTempleRegistrationPage && !isMandalRegistrationPage ? (
                <div
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2.5 px-4 lg:px-5 py-2
                             flex-1 max-w-[240px] xl:max-w-[360px] 2xl:max-w-[480px] min-w-[140px]
                             bg-orange-50/70 dark:bg-zinc-900/90 backdrop-blur-md rounded-full
                             cursor-pointer transition-all border border-orange-200/50
                             dark:border-zinc-800/50 hover:border-primary/60
                             shadow-md hover:shadow-xl hover:bg-orange-100/60 group"
                >
                  <Search className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-black/80 dark:text-white/80 text-[11px] xl:text-[13px] font-semibold truncate">
                    {mounted ? t('navbar.search_placeholder') : "Search temples, poojas, products..."}
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex justify-center">
                  <Link href="/" className="text-sm font-medium text-slate-800 hover:text-primary transition-colors">
                    {/* Clean landing header */}
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-2 xl:gap-4 2xl:gap-6 shrink-0">
                {!isTempleRegistrationPage && !isMandalRegistrationPage && navLinks.map((link) => {
                  if (link.href === "/mandals") {
                    const isMandalActive = pathname.startsWith('/mandals') || pathname.startsWith('/maza-ganesha');
                    return (
                      <DropdownMenu key="mandal-desktop-dropdown">
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`text-[11px] xl:text-[12px] 2xl:text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider relative group flex items-center gap-1 outline-none cursor-pointer py-1 ${
                              isMandalActive ? "text-primary" : "text-foreground hover:text-primary"
                            }`}
                          >
                            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-400/50 opacity-75"></span>
                              <img 
                                src="/ganesh-icon.svg" 
                                alt="Ganesh Bappa" 
                                className="relative w-4.5 h-4.5 object-contain animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,1)]"
                              />
                            </span>
                            <span>{mounted ? link.label : "Ganeshotsav"}</span>
                            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            {isMandalActive && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 mt-2 p-1.5 rounded-2xl shadow-xl border-orange-100/60 bg-white/95 backdrop-blur-md z-[100]">
                          <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider focus:bg-orange-50 focus:text-primary">
                            <Link href="/mandals" className="flex items-center justify-between w-full">
                              <span>{mounted ? t('mandal_list.explore_mandals') : "Explore Mandals"}</span>
                            </Link>
                          </DropdownMenuItem>

                          {activeCampaigns.map((c) => (
                            <React.Fragment key={c.id}>
                              <DropdownMenuSeparator className="bg-orange-100/60 my-1" />
                              <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider focus:bg-orange-50 focus:text-primary">
                                <Link href={`/campaigns/${c.slug}`} className="flex items-center justify-between w-full">
                                  <span>{c.name || c.title}</span>
                                </Link>
                              </DropdownMenuItem>
                            </React.Fragment>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-[11px] xl:text-[12px] 2xl:text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider relative group ${active ? "text-primary" : "text-foreground hover:text-primary"
                        }`}
                    >
                      {mounted ? link.label : (
                        link.href === "/poojas" ? "Poojas" :
                        link.href === "/temples" ? "Temples" :
                        link.href === "/mandals" ? "Ganeshotsav" :
                        link.href.includes("/marketplace") ? "Marketplace" :
                        link.href === "/live-darshan" ? "Live Darshan" :
                        link.href === "/donation" ? "Donation" : link.label
                      )}
                      {/* Active indicator underline */}
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">

              {/* Language Switcher */}
              {mounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full w-8 h-8 md:w-9 md:h-9 border-2 border-[#794A05]/20 hover:border-[#794A05] hover:bg-white text-[#794A05] transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="absolute -bottom-1 -right-1 bg-[#794A05] text-white text-[8px] font-black px-1 rounded-full leading-tight">
                        {langLabels[language]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 mt-2 rounded-2xl shadow-xl border-orange-100/50 bg-white/95 backdrop-blur-md z-[100]">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-[#794A05]/60 px-3 py-2">
                      {t('navbar.language')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`
                          cursor-pointer rounded-xl mx-1 px-3 py-2.5 text-sm font-medium transition-all
                          ${language === lang ? 'bg-[#794A05] text-white' : ''}
                          data-[highlighted]:bg-[#794A05]/5
                          data-[highlighted]:text-[#794A05]
                        `}
                      >
                        {langFullNames[lang]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}



              {/* Search Icon - Visible when desktop search bar is hidden */}
              {!isTempleRegistrationPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-muted-foreground w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/5 hover:bg-black/10"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="w-4 h-4 text-primary" />
                </Button>
              )}
                {/* Login Button for Institution (Temple/Mandal) */}
              {isTempleRegistrationPage && (
                <Button
                  variant="outline"
                  onClick={() => { setLoginType("temple"); setShowTempleLoginModal(true); }}
                  className="flex bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-3 md:px-5 h-8 md:h-9 text-xs font-medium transition-all hover:border-[#864c20]"
                >
                  {mounted ? t('navbar.temple_login') : "Temple Login"}
                </Button>
              )}

              {isMandalRegistrationPage && (
                <Button
                  variant="outline"
                  onClick={() => { setLoginType("mandal"); setShowTempleLoginModal(true); }}
                  className="flex bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-3 md:px-5 h-8 md:h-9 text-xs font-medium transition-all hover:border-[#864c20]"
                >
                  {mounted ? t('navbar.mandal_login') || "Mandal Login" : "Mandal Login"}
                </Button>
              )}

              {/* Notifications and Cart (only for DEVOTEE accounts) */}
              {mounted && user && user.role === "DEVOTEE" && (
                <div className="flex items-center gap-1 md:gap-2">
                  <NotificationBell userId={user.id} userType="devotee" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-8 h-8 md:w-9 md:h-9 border-2 border-[#794A05]/20 hover:border-[#794A05] hover:bg-white text-[#794A05] transition-all"
                    onClick={() => setIsCartOpen(true)}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* Profile Dropdown */}
              {variant === "default" && mounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full w-8 h-8 md:w-9 md:h-9 border-2 border-[#794A05]
                      hover:border-[#794A05] hover:bg-[#ffffff] transition-all duration-300 ease-in-out
                        hover:shadow-[0_0_0_4px_#ffffff,0_0_0_6px_#794A05] group overflow-hidden">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL.replace('/api', '')}${user.profileImage}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#794A05] transition-all duration-300 group-hover:scale-110" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 mt-3 p-2 rounded-[1.8rem] shadow-2xl border-orange-100/50 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 z-[100]">
                    <DropdownMenuLabel className="font-sans text-primary px-4 py-3 text-xs uppercase tracking-[0.2em] opacity-70">
                      {user
                        ? `${t('common.hari_om')}, ${parseLocalizedValue(user.name, language).split(' ')[0]}`
                        : t('navbar.accounts_bookings')}
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-orange-500 dark:bg-zinc-800 my-1 mx-2" />

                    <div className="p-1 space-y-1">
                      {user && user.role === "DEVOTEE" ? (
                        <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                          <Link href="/profile" className="flex items-center justify-between w-full px-4 py-3">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                              <span className="font-medium">{t('navbar.my_profile')}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                          </Link>
                        </DropdownMenuItem>
                      )
                        : user && user.role === "INSTITUTION" ? (
                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href="/temples/dashboard" className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">{t('navbar.temple_dashboard')}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>
                        )
                          : !user &&
                          (
                            <>
                              <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest font-bold text-[#88542b]/60">
                                {t('navbar.for_devotees')}
                              </div>
                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/auth" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <LogIn className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">{t('navbar.login')}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/auth?mode=register" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <UserPlus className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">{t('navbar.signup')}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>

                              <div className="py-2 mx-4 border-t border-orange-50 dark:border-zinc-800/50" />
                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/temples/register" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">{t('navbar.temple_register')}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/register-mandal" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">{t('navbar.mandal_register')}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}


                      {(user && user.role === "DEVOTEE") && (
                        <>
                          <div className="py-2 mx-4 border-t border-orange-50 dark:border-zinc-800/50" />

                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href={user ? "/profile/orders" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <ShoppingBag className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">{t('navbar.my_orders')}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href={user ? "/profile/bookings" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">{t('navbar.my_bookings')}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href={user ? "/favorites" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Heart className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">{t('navbar.my_favorites')}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      {user && (
                        <>
                          <div className="py-2 mx-4 border-t border-orange-50 dark:border-zinc-800/50" />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="focus:bg-destructive focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <LogOut className="w-4 h-4 text-destructive group-focus:text-white transition-colors" />
                              <span className="font-medium">{t('navbar.logout')}</span>
                            </div>
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>

                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative z-10 p-2 text-foreground hover:bg-black/5 rounded-lg"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Temple Login Modal */}
      <AnimatePresence>
        {showTempleLoginModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowTempleLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md"
            >
              <TempleLoginModal 
          onClose={() => setShowTempleLoginModal(false)} 
          loginType={loginType}
        />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {
          isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-40 bg-background pt-20 lg:hidden overflow-y-auto max-h-screen"
            >
              <div className="container px-4 py-6 pb-28">
                <div className="flex flex-col gap-3">
                  {/* Navigation links - Hidden on temple registration page */}
                  {!isTempleRegistrationPage && navLinks.map((link) => {
                    if (link.href === "/mandals") {
                      return (
                        <div key="mandal-mobile-group" className="py-2 border-b border-border space-y-1">
                          <div className="text-xs font-black text-primary uppercase tracking-widest px-1 py-1 flex items-center gap-2">
                            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-amber-400/50 opacity-75"></span>
                              <img 
                                src="/ganesh-icon.svg" 
                                alt="Ganesh Bappa" 
                                className="relative w-5.5 h-5.5 object-contain animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,1)]"
                              />
                            </span>
                            <span>{mounted ? link.label : "Ganeshotsav"}</span>
                          </div>
                          <Link
                            href="/mandals"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`text-base font-bold py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors ${
                              pathname === '/mandals' ? "text-primary bg-primary/10" : "text-foreground hover:text-primary"
                            }`}
                          >
                            <span>{mounted ? t('mandal_list.explore_mandals') : "Explore Mandals"}</span>
                            <ChevronRight className="w-4 h-4 text-primary" />
                          </Link>
                          {activeCampaigns.map((c) => (
                            <Link
                              key={c.id}
                              href={`/campaigns/${c.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`text-base font-bold py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors ${
                                pathname.startsWith(`/campaigns/${c.slug}`) ? "text-primary bg-primary/10" : "text-foreground hover:text-primary"
                              }`}
                            >
                              <span>{c.name || c.title}</span>
                              <ChevronRight className="w-4 h-4 text-primary" />
                            </Link>
                          ))}
                        </div>
                      );
                    }

                    const active = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-lg font-bold py-3 border-b border-border flex items-center justify-between transition-colors ${active ? "text-primary bg-primary/5 px-2 rounded-lg border-b-0" : "text-foreground"
                          }`}
                      >
                        {mounted ? link.label : (
                          link.href === "/poojas" ? "Poojas" :
                          link.href === "/temples" ? "Temples" :
                          link.href === "/mandals" ? "Mandals" :
                          link.href.includes("/marketplace") ? "Marketplace" :
                          link.href === "/live-darshan" ? "Live Darshan" :
                          link.href === "/donation" ? "Donation" : link.label
                        )}
                        {active && <ChevronRight className="w-5 h-5" />}
                      </Link>
                    );
                  })}

                  {/* Go to Devotee Home Page - Only on temple registration page */}
                  {/* {isTempleRegistrationPage && (
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-dark-foreground py-2 border-b border-border"
                    >
                      Go to Devotee Home Page
                    </Link>
                  )} */}
                  <div className="flex flex-col gap-3 mt-6">
                    {!user ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline-sacred" size="lg" asChild>
                          <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                            <LogIn className="w-4 h-4" /> {t('navbar.login')}
                          </Link>
                        </Button>
                        <Button variant="sacred" size="lg" asChild>
                          <Link href="/auth?mode=register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" /> {t('navbar.signup')}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50 bg-orange-50/50">
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                          <div className="w-10 h-10 rounded-full border border-orange-200 overflow-hidden">
                            {user.profileImage ? (
                              <img src={user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL.replace('/api', '')}${user.profileImage}`} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 m-3 text-orange-600" />
                            )}
                          </div>
                          <div className="flex flex-col items-start translate-y-[-2px]">
                            <span className="font-bold text-slate-900">{parseLocalizedValue(user.name, language)}</span>
                            <span className="text-xs text-slate-500 font-medium tracking-tight">
                              {t('navbar.view_sacred_profile')}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
                        </Link>
                      </Button>
                    )}

                    {user && (
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsCartOpen(true);
                        }}
                        className="justify-start gap-4 h-14 rounded-2xl border border-border/50 bg-primary/5 text-primary"
                      >
                        <div className="relative">
                          <ShoppingCart className="w-5 h-5" />
                          {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                              {itemCount}
                            </span>
                          )}
                        </div>
                        <span className="font-bold">{t('navbar.my_cart')}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    )}

                    {(!user || user.role === "DEVOTEE") && (
                      <>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/temples/register" onClick={() => setIsMobileMenuOpen(false)}>
                            <Church className="w-5 h-5 text-orange-600" />
                            <span>{t('navbar.temple_register')}</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50 mt-2">
                          <Link href="/register-mandal" onClick={() => setIsMobileMenuOpen(false)}>
                            <Church className="w-5 h-5 text-orange-600" />
                            <span>{t('navbar.mandal_register')}</span>
                          </Link>
                        </Button>
                      </>
                    )}

                    {/* Temple Login - Mobile Menu (only for temple variant) */}
                    {variant === "temple" && (
                      <Button
                        size="lg"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setShowTempleLoginModal(true);
                        }}
                        className="justify-start gap-4 h-14 rounded-2xl bg-[#88542B] hover:bg-[#CA9E52] text-white border-0"
                      >
                        <LogIn className="w-5 h-5" />
                        <span className="font-bold">{mounted ? t('navbar.temple_login') : "Temple Login"}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                      </Button>
                    )}

                    {user && user.role === "DEVOTEE" && (
                      <>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/profile/orders" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShoppingBag className="w-5 h-5 text-orange-600" />
                            <span>{t('navbar.my_orders')}</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/profile/bookings" onClick={() => setIsMobileMenuOpen(false)}>
                            <Church className="w-5 h-5 text-orange-600" />
                            <span>{t('navbar.my_bookings')}</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/favorites" onClick={() => setIsMobileMenuOpen(false)}>
                            <Heart className="w-5 h-5 text-orange-600" />
                            <span>{t('navbar.my_favorites')}</span>
                          </Link>
                        </Button>
                      </>
                    )}

                    {user && (
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleLogout}
                        className="justify-start gap-4 h-14 rounded-2xl border border-red-100 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{t('navbar.logout')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
      <CartDrawer
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          if (!user) {
            setIsCartOpen(false);
            router.push("/auth?mode=login");
            return;
          }

          if (user.role !== "DEVOTEE") {
            setIsCartOpen(false);
            router.push("/auth?mode=login");
            return;
          }

          setIsCartOpen(false);
          router.push("/marketplace/checkout");
        }}
      />
    </>
  );
};

export default Navbar;
