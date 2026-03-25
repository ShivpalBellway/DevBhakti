import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "@/components/icons/Logo";

const Footer: React.FC = () => {
  const footerLinks = {
    offerings: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Live Darshan", href: "/live-darshan" },
      { label: "Sacred Temples", href: "/temples" },
      { label: "Trust & Transparency", href: "/#trust" },
    ],
    platform: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Register Temple/Login", href: "/temples/register" },
      { label: "Seller Login", href: "/seller" },
    ],
    legal: [
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Returns & Refund Policy", href: "/returns-refund-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Grievance Officer", href: "/grievance-officer" },
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
              Connecting devotees with sacred temples through technology.
              Experience divine darshan, book poojas, and shop authentic
              spiritual products.
            </p>
            {/* Social icons disabled as requested */}
          </div>

          {/* Offerings Links */}
          <div>
            <h4 className="font-semibold text-lg mb-2">Offerings</h4>
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
            <h4 className="font-semibold text-lg mb-2">Platform</h4>
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
            <h4 className="font-semibold text-lg mb-2">Legal</h4>
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
          <div>
            <h4 className="font-semibold text-lg mb-2">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="flex items-center gap-2 hover:text-[#DCB35D] transition-colors text-sm whitespace-nowrap">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {link.label}
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
              {/* <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                +91 123 456 7890
              </a> */}
            </div>
            <p className="text-sm text-sidebar-foreground/50">
              © {new Date().getFullYear()} DevBhakti™
              is owned and operated by Divinity Labs Private Limited. All rights reserved.

            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
