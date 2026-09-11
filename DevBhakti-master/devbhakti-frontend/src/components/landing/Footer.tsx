"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "@/components/icons/Logo";
import { fetchMandalRegistrationStatus } from "@/api/publicController";
import { useLanguage } from "@/context/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  const [isMandalRegistrationEnabled, setIsMandalRegistrationEnabled] = useState(false);

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
    <footer className="bg-warm-brown text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 gap-y-12">
          {/* Brand */}
          <div className="sm:col-span-2 xl:col-span-2">
            <Logo size="lg" variant="full" className="text-white bg-white rounded-2xl" />
            <p className="text-sidebar-foreground/70 mt-4 max-w-sm">
              {t('landing.landing_footer.about')}
            </p>
            {/* Social icons disabled as requested */}
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
    </footer>
  );
};

export default Footer;
