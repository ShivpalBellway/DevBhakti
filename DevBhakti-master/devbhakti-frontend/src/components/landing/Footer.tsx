"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Smartphone, X } from "lucide-react";
import Logo from "@/components/icons/Logo";
import { fetchMandalRegistrationStatus } from "@/api/publicController";
import { useLanguage } from "@/context/LanguageContext";
import { AppQRCode } from "@/components/common/AppQRCode";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  const [isMandalRegistrationEnabled, setIsMandalRegistrationEnabled] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    const checkMandalStatus = async () => {
      const res = await fetchMandalRegistrationStatus();
      if (res.success && res.enabled) {
        setIsMandalRegistrationEnabled(true);
      }
    };
    checkMandalStatus();
  }, []);

  const platformLinks = [
    { label: t('landing.landing_footer.links.about'), href: "/about" },
    { label: t('landing.landing_footer.links.contact'), href: "/contact" },
    { label: t('landing.landing_footer.links.temple_register'), href: "/temples/register" },
    { label: t('landing.landing_footer.links.seller_login'), href: "/seller" },
  ];

  if (isMandalRegistrationEnabled) {
    platformLinks.push({ label: t('landing.landing_footer.links.mandal_register'), href: "/register-mandal" });
  }

  const footerLinks = {
    offerings: [
      { label: t('landing.landing_footer.links.marketplace'), href: "/marketplace" },
      { label: t('landing.landing_footer.links.live_darshan'), href: "/live-darshan" },
      { label: t('landing.landing_footer.links.temples'), href: "/temples" },
      { label: t('landing.landing_footer.links.trust'), href: "/#trust" },
    ],
    platform: platformLinks,
    legal: [
      { label: t('landing.landing_footer.links.terms'), href: "/terms-of-service" },
      { label: t('landing.landing_footer.links.privacy'), href: "/privacy-policy" },
      { label: t('landing.landing_footer.links.returns'), href: "/returns-refund-policy" },
      { label: t('landing.landing_footer.links.shipping'), href: "/shipping-policy" },
      { label: t('landing.landing_footer.links.grievance'), href: "/grievance-officer" },
    ],
    support: [
      { label: "support@devbhakti.in", href: "mailto:support@devbhakti.in" },
      { label: "grievance.officer@devbhakti.in", href: "mailto:grievance.officer@devbhakti.in" },
    ],
  };

  return (
    <footer className="bg-warm-brown text-sidebar-foreground relative">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 gap-y-12">
          {/* Brand */}
          <div className="sm:col-span-2 xl:col-span-2">
            <Logo size="lg" variant="full" className="text-white bg-white rounded-2xl" />
            <p className="text-sidebar-foreground/70 mt-4 max-w-sm">
              {t('landing.landing_footer.about')}
            </p>
          </div>

          {/* Offerings Links */}
          <div>
            <h4 className="font-semibold text-lg mb-2">{t('landing.landing_footer.headings.offerings')}</h4>
            <ul className="space-y-3">
              {footerLinks.offerings.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-[#DCB35D] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* Get App Link with QR Modal Trigger */}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 px-2.5 py-1.5 rounded-lg border border-amber-400/40 hover:border-amber-400 transition-all shadow-sm group"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Get DevBhakti App</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-lg mb-2">{t('landing.landing_footer.headings.platform')}</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-[#DCB35D] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-lg mb-2">{t('landing.landing_footer.headings.legal')}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sidebar-foreground/70 hover:text-[#DCB35D] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="font-semibold text-lg mb-2">{t('landing.landing_footer.headings.support')}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-[#DCB35D] transition-colors text-xs sm:text-sm break-all font-medium"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="break-all">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-[#DCB35D] mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sidebar-foreground/70">
              <a href="mailto:support@devbhakti.in" className="flex items-center gap-2 hover:text-[#DCB35D] transition-colors">
                <Mail className="w-4 h-4" />
                support@devbhakti.in
              </a>
            </div>
            <p className="text-sm text-sidebar-foreground/50">
              © {new Date().getFullYear()} DevBhakti™
              {t('landing.landing_footer.copyright_suffix')}
            </p>
          </div>
        </div>
      </div>

      {/* App Download QR Code Modal Dialog */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[340px] bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-amber-300/50 text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-[#7c4624]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Get DevBhakti App</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Sacred Darshan & Pooja</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: Enlarged Center-Logo QR Code */}
            <div className="py-3 flex flex-col items-center justify-center text-center">
              <AppQRCode size={260} showLabels={false} logoUrl="/logo.png" />
              <div className="mt-3 space-y-0.5">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Scan QR Code to Download App
                </p>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
