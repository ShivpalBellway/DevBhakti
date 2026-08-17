"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  Save,
  Upload,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMandalRegistrationSettingsAdmin,
  updateMandalRegistrationSettingsAdmin,
} from "@/api/adminController";
import { BASE_URL } from "@/config/apiConfig";

export default function MandalSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("en");

  const [enabled, setEnabled] = useState(false);
  const [formData, setFormData] = useState({
    title_en: "",
    title_hi: "",
    title_mr: "",
    subtitle_en: "",
    subtitle_hi: "",
    subtitle_mr: "",
    startDate: "",
    endDate: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchMandalRegistrationSettingsAdmin();
      console.log("Fetched Mandal settings:", data);
      if (data && data.success) {
        const s = data.settings || data;
        setEnabled(!!s.enabled);
        setFormData({
          title_en: s.title?.en || "",
          title_hi: s.title?.hi || "",
          title_mr: s.title?.mr || "",
          subtitle_en: s.subtitle?.en || "",
          subtitle_hi: s.subtitle?.hi || "",
          subtitle_mr: s.subtitle?.mr || "",
          startDate: s.startDate || "",
          endDate: s.endDate || "",
        });

        if (s.image) {
          const imgUrl = s.image.startsWith("http")
            ? s.image
            : `${BASE_URL}${s.image}`;
          setImagePreview(imgUrl);
        } else {
          setImagePreview("");
        }
      }
    } catch (error) {
      console.error("Error loading Mandal settings:", error);
      toast({
        title: "Error",
        description: "Failed to load Mandal settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(croppedFile));
    setShowCropper(false);
    setTempImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = new FormData();
      data.append("enabled", enabled.toString());
      data.append("title_en", formData.title_en);
      data.append("title_hi", formData.title_hi);
      data.append("title_mr", formData.title_mr);
      data.append("subtitle_en", formData.subtitle_en);
      data.append("subtitle_hi", formData.subtitle_hi);
      data.append("subtitle_mr", formData.subtitle_mr);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);

      if (imageFile) {
        data.append("image", imageFile);
      }

      const res = await updateMandalRegistrationSettingsAdmin(data);
      if (res && res.success) {
        toast({
          title: "Settings Saved",
          description: "Mandal registration settings have been updated successfully.",
          variant: "success",
        });
        loadSettings();
      } else {
        toast({
          title: "Update Failed",
          description: res.message || "Failed to save settings.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error saving Mandal settings:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update Mandal settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground text-sm font-medium">
          Loading Mandal Settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6">
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setTempImage(null);
          }}
          initialAspect={1920 / 600}
          lockAspect={true}
          title="Adjust Festival Banner Image"
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-orange-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Mandal Registration Settings
            </h1>
          </div>
          <p className="text-muted-foreground text-base">
            Manage festival Mandal registration status, festive titles, banner image, and festival date range.
          </p>
        </div>
        <Badge
          variant={enabled ? "default" : "outline"}
          className={`px-4 py-1.5 text-sm font-semibold self-start md:self-center ${
            enabled ? "bg-green-600 hover:bg-green-700 text-white" : ""
          }`}
        >
          {enabled ? "Registration Active" : "Registration Disabled"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Toggle Switch Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/30 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <Label htmlFor="enabled-switch" className="text-lg font-bold text-foreground cursor-pointer">
                Mandal Registration Toggle
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Turn ON to enable Mandal registration for devotees and mandal organizers across the website.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 px-5 py-3 rounded-xl border border-border shrink-0">
            <span
              className={`text-sm font-bold ${
                enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              }`}
            >
              {enabled ? "ENABLED" : "DISABLED"}
            </span>
            <Switch
              id="enabled-switch"
              checked={enabled}
              onCheckedChange={setEnabled}
              className="scale-125"
            />
          </div>
        </div>

        {/* Multilingual Title & Subtitle Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  Festive Details & Multilingual Titles
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Set festival title & subtitle in English, Hindi, and Marathi.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md h-10 mb-6 bg-muted p-1 rounded-xl">
              <TabsTrigger value="en" className="text-xs uppercase font-bold tracking-wider rounded-lg">
                English
              </TabsTrigger>
              <TabsTrigger value="hi" className="text-xs uppercase font-bold tracking-wider rounded-lg">
                Hindi (हिंदी)
              </TabsTrigger>
              <TabsTrigger value="mr" className="text-xs uppercase font-bold tracking-wider rounded-lg">
                Marathi (मराठी)
              </TabsTrigger>
            </TabsList>

            {(["en", "hi", "mr"] as const).map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="space-y-2">
                  <Label htmlFor={`title_${lang}`} className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>
                      {lang === "hi"
                        ? "मंडल शीर्षक (Title)"
                        : lang === "mr"
                        ? "मंडळ शीर्षक (Title)"
                        : "Mandal Festive Title"}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({lang.toUpperCase()})
                    </span>
                  </Label>
                  <Input
                    id={`title_${lang}`}
                    placeholder={
                      lang === "hi"
                        ? "उदा. गणेश उत्सव २०२६ मंडल पंजीकरण"
                        : lang === "mr"
                        ? "उदा. गणेशोत्सव २०२६ मंडळ नोंदणी"
                        : "e.g. Ganesh Utsav 2026 Mandal Registration"
                    }
                    value={(formData as any)[`title_${lang}`]}
                    onChange={(e) =>
                      setFormData({ ...formData, [`title_${lang}`]: e.target.value })
                    }
                    className="h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subtitle_${lang}`} className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>
                      {lang === "hi"
                        ? "उपशीर्षक (Sub Title)"
                        : lang === "mr"
                        ? "उपशीर्षक (Sub Title)"
                        : "Mandal Festive Subtitle"}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({lang.toUpperCase()})
                    </span>
                  </Label>
                  <Input
                    id={`subtitle_${lang}`}
                    placeholder={
                      lang === "hi"
                        ? "उदा. अपने मंडल को अब पंजीकृत करें और भक्तों से जुड़ें"
                        : lang === "mr"
                        ? "उदा. तुमचे मंडळ आताच नोंदवा आणि भक्तांशी जोडा"
                        : "e.g. Register your Mandal today and connect with devotees worldwide"
                    }
                    value={(formData as any)[`subtitle_${lang}`]}
                    onChange={(e) =>
                      setFormData({ ...formData, [`subtitle_${lang}`]: e.target.value })
                    }
                    className="h-11 text-base"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Date Range & Banner Card */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Festival Dates */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  Festival Date Range
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Define the start date and end date of the festival season for Mandal registration.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-foreground">
                    Festival Start Date
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-foreground">
                    Festival End Date
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner Image Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b pb-3">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Festival Banner Image
              </h2>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Banner Graphic (Aspect 3.2 - 1920x600 px)
              </Label>

              <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/40 transition-colors cursor-pointer relative group">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    Click to upload festival banner
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Supports PNG, JPG, WEBP (Max 10MB)
                  </div>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleFileChange}
                />
              </div>

              {imagePreview && (
                <div className="mt-3 relative w-full h-44 bg-muted rounded-xl overflow-hidden border border-border shadow-inner flex items-center justify-center">
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt="Mandal Banner Preview"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end border-t pt-6">
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 shadow-lg text-base rounded-xl gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Mandal Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
