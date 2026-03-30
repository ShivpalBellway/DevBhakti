"use client";

import React, { useState, useEffect } from "react";
import { 
  Save, 
  Plus, 
  Trash2, 
  Layout, 
  Search, 
  Globe, 
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";

const PREDEFINED_PAGES = [
  { label: "Home Page", value: "home", path: "/" },
  { label: "About Us", value: "about", path: "/about" },
  { label: "Contact Us", value: "contact", path: "/contact" },
  { label: "Live Darshan List", value: "live-darshan", path: "/live-darshan" },
  { label: "Temples List", value: "temple-list", path: "/temples" },
  { label: "Marketplace", value: "marketplace", path: "/marketplace" },
  { label: "Donation", value: "donation", path: "/donation" },
  { label: "Poojas & Sevas", value: "poojas", path: "/poojas" },
];

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
}

interface SeoSettings {
  [key: string]: SeoMetadata;
}

export default function SeoCmsPage() {
  const [settings, setSettings] = useState<SeoSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<string>("home");
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token") || localStorage.getItem("staff_token");
      const response = await axios.get(`${API_URL}/admin/settings/seo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Ensure all predefined pages have at least empty objects
        const loadedSettings = response.data.settings || {};
        const mergedSettings = { ...loadedSettings };
        
        PREDEFINED_PAGES.forEach(page => {
          if (!mergedSettings[page.value]) {
            mergedSettings[page.value] = { title: "", description: "", keywords: "" };
          }
        });
        
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SeoMetadata, value: string) => {
    setSettings(prev => ({
      ...prev,
      [activePage]: {
        ...prev[activePage],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_token") || localStorage.getItem("staff_token");
      const response = await axios.patch(
        `${API_URL}/admin/settings/seo`,
        { settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "SEO settings saved successfully",
        });
      }
    } catch (error: any) {
      console.error("Error saving SEO settings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPageData = settings[activePage] || { title: "", description: "", keywords: "" };
  const currentPageInfo = PREDEFINED_PAGES.find(p => p.value === activePage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            SEO Meta Tags
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage search engine metadata for individual platform pages.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-11"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selector Sidebar */}
        <Card className="lg:col-span-1 border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Select Page
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {PREDEFINED_PAGES.map((page) => (
                <button
                  key={page.value}
                  onClick={() => setActivePage(page.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                    activePage === page.value
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-primary"
                  }`}
                >
                  <span>{page.label}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activePage === page.value ? "translate-x-1" : ""}`} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor Form */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-slate-200/60 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/30 border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {currentPageInfo?.label}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1 font-medium">
                    Route: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary text-xs">{currentPageInfo?.path}</code>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Title Tag */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Meta Title (Title Tag)
                  </Label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    currentPageData.title.length > 60 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {currentPageData.title.length} / 60 Recommended
                  </span>
                </div>
                <Input
                  id="title"
                  placeholder="Enter page title for search results..."
                  value={currentPageData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary/50 focus:ring-primary/20 h-12 text-base font-medium shadow-sm transition-all"
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Appears as the blue link in search results. Keep it between 50-60 characters.
                </p>
              </div>

              {/* Meta Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Meta Description
                  </Label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    currentPageData.description.length > 160 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {currentPageData.description.length} / 160 Recommended
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Enter a brief summary of this page's content..."
                  value={currentPageData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary/50 focus:ring-primary/20 min-h-[120px] text-base font-medium shadow-sm transition-all resize-none p-4"
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Short summary that appears under the title. Keep it under 160 characters.
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <Label htmlFor="keywords" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Keywords (Comma Separated)
                </Label>
                <Input
                  id="keywords"
                  placeholder="temple, darshan, pooja, spiritual..."
                  value={currentPageData.keywords}
                  onChange={(e) => handleInputChange("keywords", e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-primary/50 focus:ring-primary/20 h-12 text-base font-medium shadow-sm transition-all"
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Optional words or phrases that describe the page content.
                </p>
              </div>

              {/* Preview Visualization */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Google Search Preview</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1 truncate">
                    https://devbhakti.in {currentPageInfo?.path !== "/" && <span className="flex items-center"><ChevronRight className="w-3 h-3" /> {currentPageInfo?.path.substring(1)}</span>}
                  </div>
                  <div className="text-xl text-[#1a0dab] hover:underline cursor-pointer mb-2 font-medium truncate">
                    {currentPageData.title || "Page Title Preview"}
                  </div>
                  <div className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                    {currentPageData.description || "Enter a meta description to see how your page will appear in search engine results. This summary should describe the content of the page."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">SEO Best Practices</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Include your primary keyword in the title and description for better ranking.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Dynamic Content</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Individual temples manage their own SEO settings within the temple editor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
