"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ChevronRight, User, LogIn, UserPlus, ShoppingBag, Church, Search, ArrowRight, LogOut } from "lucide-react";
import { BASE_URL } from "@/config/apiConfig";

import { Button } from "@/components/ui/button";
import Logo from "@/components/icons/Logo";
import { GlobalSearch } from "./GlobalSearch";
import TempleLoginModal from "@/components/temples/TempleLoginModal";
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
}

const Navbar: React.FC<NavbarProps> = ({ variant = "default" }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTempleLoginModal, setShowTempleLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    window.location.reload();
  };


  const navLinks = [
    { label: "Poojas & Sevas", href: "/poojas" },
    { label: "Verified Temples", href: "/temples" },
    { label: "Sacred Items", href: "/marketplace?category=All" },
    { label: "Live Darshan", href: "/live-darshan" },
    // { label: "Buy Prasad", href: "/marketplace?category=Prasad" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-soft border-b border-border"
          : "bg-transparent"
          }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo & Search Bar Container */}
            <div className="flex items-center gap-4 lg:gap-8 min-w-0">
              <Link href="/" className="relative z-10 flex-shrink-0">
                {/* <Logo className="h-28 w-28 " /> */}
                <Logo
                  className={`h-28 w-28 transition-colors duration-300 ${isScrolled ? "" : "h-28 w-24"
                    }`}
                />
              </Link>


            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">

              {/* Desktop Search Bar - More Prominent Glassmorphism */}
              <div
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2.5 px-6 py-3
             w-[350px] md:w-[350px] lg:w-[400px]
             bg-white/30 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl
             cursor-pointer transition-all border border-black/50
             dark:border-zinc-800/50 hover:border-primary/60
             shadow-sm hover:shadow-md"
              >
                <Search className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-black dark:text-black text-sm font-medium truncate">
                  Search temples, poojas, products...
                </span>
              </div>



              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-md font-medium text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-2 md:gap-3">


              {/* Mobile Search Icon - Only shows on very small screens */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-2 h-3" />
              </Button>

              {variant === "default" ? (
                !user && (
                  <Button
                    variant="outline"
                    className="hidden md:flex bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-4 h-9 mr-2 text-sm font-medium transition-all hover:border-[#864c20]"
                    asChild
                  >
                    <Link href="/temples/register">
                      Register as Temple
                    </Link>
                  </Button>
                )
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowTempleLoginModal(true)}
                  className="hidden md:flex bg-[#88542B] border-[#c2a087] text-white hover:bg-[#CA9E52] hover:text-white rounded-full px-6 h-9 mr-2 text-sm font-medium transition-all hover:border-[#864c20]"
                >
                  Temple Login
                </Button>
              )}



              {/* Profile Dropdown */}
              {variant === "default" && (
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
                      {!user ? (
                        <>
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
                        </>
                      ) : (
                        <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                          <Link href="/profile" className="flex items-center justify-between w-full px-4 py-3">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                              <span className="font-medium">My Profile</span>
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                          </Link>
                        </DropdownMenuItem>
                      )}


                      <div className="py-2 mx-4 border-t border-orange-50 dark:border-zinc-800/50" />

                      <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                        <Link href="/auth" className="flex items-center justify-between w-full px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ShoppingBag className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                            <span className="font-medium">My Orders</span>
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="focus:bg-primary focus:text-white rounded-[1.2rem] cursor-pointer transition-all duration-300 group">
                        <Link href={user ? "/account/poojas" : "/auth"} className="flex items-center justify-between w-full px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Church className="w-4 h-4 text-primary group-focus:text-white transition-colors" />
                            <span className="font-medium">My Poojas</span>
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-0 group-focus:opacity-100 -translate-x-2 group-focus:translate-x-0 transition-all" />
                        </Link>
                      </DropdownMenuItem>

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
                className="lg:hidden relative z-10 p-2 text-foreground"
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-background pt-20 md:hidden"
            >
              <div className="container px-4 py-8">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground py-2 border-b border-border"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="flex flex-col gap-3 mt-6">
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
                    <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                      <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShoppingBag className="w-5 h-5 text-orange-600" />
                        <span>My Orders</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="justify-start gap-4 h-14 rounded-2xl border border-border/50">
                      <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        <Church className="w-5 h-5 text-orange-600" />
                        <span>My Poojas</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </>
  );
};

export default Navbar;