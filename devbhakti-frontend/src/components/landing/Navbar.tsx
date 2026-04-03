"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, User, LogIn, UserPlus, ShoppingBag, ShoppingCart, Church, Search, ArrowRight, LogOut, Heart } from "lucide-react";
import { BASE_URL } from "@/config/apiConfig";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { GlobalSearch } from "./GlobalSearch";
import TempleLoginModal from "@/components/temples/TempleLoginModal";
import { useCart } from "@/context/CartContext";
import { clearAllTokens } from "@/lib/auth-utils";
import CartDrawer from "@/components/marketplace/CartDrawer";
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the temple registration page
  const isTempleRegistrationPage = pathname === '/temples/register';
  const { cartItems, itemCount, updateQuantity, removeFromCart } = useCart();

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
    return () => window.removeEventListener("scroll", handleScroll);
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


  const navLinks = [
    { label: "Poojas & Sevas", href: "/poojas" },
    { label: "Sacred Temples", href: "/temples" },
    { label: "Sacred Items", href: "/marketplace?category=All" },
    { label: "Live Darshan", href: "/live-darshan" },
    { label: "Donation", href: "/donation" }
    // { label: "Buy Prasad", href: "/marketplace?category=Prasad" },
  ];

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
          <nav className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "h-18 md:h-20" : "h-22 md:h-26"} gap-4 md:gap-6`}>
            {/* Logo Section */}
            <div className="flex items-center shrink-0 relative z-10">
              <Link href="/" className="block">
                <Logo
                  className={`h-12 md:h-16 xl:h-20 2xl:h-24 w-auto transition-all duration-300 ${isScrolled ? "scale-90" : "scale-100"
                    }`}
                />
              </Link>
            
            </div>

            {/* Desktop Navigation & Search (Wide Screens Only) */}
            <div className="hidden xl:flex flex-1 items-center justify-between gap-4 2xl:gap-10 mx-2 xl:mx-4 2xl:mx-8">
              {/* Desktop Search Bar */}
              {!isTempleRegistrationPage ? (
                <div
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-3 px-6 py-2.5
                             flex-1 max-w-[350px] 2xl:max-w-[550px] min-w-[200px]
                             bg-orange-50/70 dark:bg-zinc-900/90 backdrop-blur-md rounded-full
                             cursor-pointer transition-all border border-orange-200/50
                             dark:border-zinc-800/50 hover:border-primary/60
                             shadow-md hover:shadow-xl hover:bg-orange-100/60 group"
                >
                  <Search className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-black/80 dark:text-white/80 text-[13px] font-semibold truncate">
                    Search temples, poojas, products...
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex justify-center">
                  <Link href="/" className="text-sm font-medium text-slate-800 hover:text-primary transition-colors">
                    {/* Go to Devotee Home Page */}
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-3 2xl:gap-8 shrink-0">
                {!isTempleRegistrationPage && navLinks.map((link) => {
                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`text-[12px] 2xl:text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wider relative group ${active ? "text-primary" : "text-foreground hover:text-primary"
                        }`}
                    >
                      {link.label}
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
            <div className="flex items-center gap-2 md:gap-3 shrink-0">


              {/* Search Icon - Visible when desktop search bar is hidden */}
              {!isTempleRegistrationPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden text-muted-foreground w-10 h-10 rounded-full bg-black/5 hover:bg-black/10"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="w-5 h-5 text-primary" />
                </Button>
              )}

              {variant === "default" ? null : (
                <Button
                  variant="outline"
                  onClick={() => setShowTempleLoginModal(true)}
                  className="hidden md:flex bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-6 h-9 mr-2 text-sm font-medium transition-all hover:border-[#864c20]"
                >
                  Temple Login
                </Button>
              )}

              {/* Cart Icon (only for DEVOTEE accounts) */}
              {user && user.role === "DEVOTEE" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full w-9 h-9 md:w-10 md:h-10 border-2 border-[#794A05]/20 hover:border-[#794A05] hover:bg-white text-[#794A05] transition-all"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Profile Dropdown */}
              {variant === "default" && mounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 md:w-10 md:h-10 border-2 border-[#794A05]
                      hover:border-[#794A05] hover:bg-[#ffffff] transition-all duration-300 ease-in-out
                        hover:shadow-[0_0_0_4px_#ffffff,0_0_0_6px_#794A05] group overflow-hidden">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL.replace('/api', '')}${user.profileImage}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 md:w-5 md:h-5 text-[#794A05] transition-all duration-300 group-hover:scale-110" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64 mt-3 p-2 rounded-[1.8rem] shadow-2xl border-orange-100/50 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <DropdownMenuLabel className="font-sans text-primary px-4 py-3 text-xs uppercase tracking-[0.2em] opacity-70">
                      {user ? `Hari Om, ${user.name.split(' ')[0]}` : "Accounts & Bookings"}
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-orange-500 dark:bg-zinc-800 my-1 mx-2" />

                    <div className="p-1 space-y-1">
                      {user && user.role === "DEVOTEE" ? (
                        <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                          <Link href="/profile" className="flex items-center justify-between w-full px-4 py-3">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                              <span className="font-medium">My Profile</span>
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
                                <span className="font-medium">Temple Dashboard</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>
                        )
                          : !user &&
                          (
                            <>
                              <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest font-bold text-[#88542b]/60">
                                For Devotees
                              </div>
                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/auth" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <LogIn className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">Login</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/auth?mode=register" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <UserPlus className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">Sign Up</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                                </Link>
                              </DropdownMenuItem>

                              <div className="py-2 mx-4 border-t border-orange-50 dark:border-zinc-800/50" />
                              <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                                <Link href="/temples/register" className="flex items-center justify-between w-full px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                    <span className="font-medium">Temple Registration</span>
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
                                <span className="font-medium">My Orders</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href={user ? "/profile/bookings" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">My Pooja Bookings</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                            <Link href={user ? "/favorites" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Heart className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                                <span className="font-medium">My Favorites</span>
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
                              <span className="font-medium">Logout</span>
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
                className="xl:hidden relative z-10 p-2 text-foreground hover:bg-black/5 rounded-lg"
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
              <TempleLoginModal onClose={() => setShowTempleLoginModal(false)} />
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
              className="fixed inset-0 z-40 bg-background pt-24 xl:hidden"
            >
              <div className="container px-4 py-8">
                <div className="flex flex-col gap-4">
                  {/* Navigation links - Hidden on temple registration page */}
                  {!isTempleRegistrationPage && navLinks.map((link) => {
                    const active = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-lg font-bold py-3 border-b border-border flex items-center justify-between transition-colors ${active ? "text-primary bg-primary/5 px-2 rounded-lg border-b-0" : "text-foreground"
                          }`}
                      >
                        {link.label}
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
                            <LogIn className="w-4 h-4" /> Login
                          </Link>
                        </Button>
                        <Button variant="sacred" size="lg" asChild>
                          <Link href="/auth?mode=register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" /> Sign Up
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
                            <span className="font-bold text-slate-900">{user.name}</span>
                            <span className="text-xs text-slate-500 font-medium tracking-tight">View Sacred Profile</span>
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
                        <span className="font-bold">My Cart</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    )}

                    {(!user || user.role === "DEVOTEE") && (
                      <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                        <Link href="/temples/register" onClick={() => setIsMobileMenuOpen(false)}>
                          <Church className="w-5 h-5 text-orange-600" />
                          <span>Temple Registration</span>
                        </Link>
                      </Button>
                    )}

                    {user && user.role === "DEVOTEE" && (
                      <>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/profile/orders" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShoppingBag className="w-5 h-5 text-orange-600" />
                            <span>My Orders</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/profile/bookings" onClick={() => setIsMobileMenuOpen(false)}>
                            <Church className="w-5 h-5 text-orange-600" />
                            <span>My Pooja Bookings</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                          <Link href="/favorites" onClick={() => setIsMobileMenuOpen(false)}>
                            <Heart className="w-5 h-5 text-orange-600" />
                            <span>My Favorites</span>
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
                        <span>Logout</span>
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
