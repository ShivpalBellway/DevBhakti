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
  Plus,
  Trash2,
  Edit,
  Radio,
  Clock,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingFestival, setSavingFestival] = useState(false);

  // Two-Level Settings State
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [activeFestival, setActiveFestival] = useState<any>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingFestival, setViewingFestival] = useState<any>(null);
  const [editingFestivalId, setEditingFestivalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("en");

  const [formData, setFormData] = useState({
    name: "",
    title_en: "",
    title_hi: "",
    title_mr: "",
    subtitle_en: "",
    subtitle_hi: "",
    subtitle_mr: "",
    startDate: "",
    endDate: "",
    isActive: false,
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
        setGlobalEnabled(data.globalEnabled !== undefined ? data.globalEnabled : !!s.globalEnabled);
        
        const list = Array.isArray(data.festivals) ? data.festivals : (Array.isArray(s.festivals) ? s.festivals : []);
        setFestivals(list);

        const currentActive = list.find((f: any) => f.isActive) || data.activeFestival || null;
        setActiveFestival(currentActive);
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

  // Master Global Switch Handler
  const handleToggleGlobal = async (checked: boolean) => {
    try {
      setSavingGlobal(true);
      setGlobalEnabled(checked);

      const fd = new FormData();
      fd.append("action", "toggleGlobal");
      fd.append("globalEnabled", checked.toString());

      const res = await updateMandalRegistrationSettingsAdmin(fd);
      if (res && res.success) {
        toast({
          title: checked ? "Registration Enabled" : "Registration Disabled",
          description: checked
            ? "Mandal registration is now LIVE across the website."
            : "Mandal registration is now OFF for users.",
          variant: checked ? "success" : "default",
        });
        loadSettings();
      }
    } catch (error) {
      console.error("Error toggling global setting:", error);
      toast({
        title: "Error",
        description: "Failed to update global switch",
        variant: "destructive",
      });
    } finally {
      setSavingGlobal(false);
    }
  };

  // Activate Festival Handler
  const handleActivateFestival = async (festivalId: string) => {
    try {
      const fd = new FormData();
      fd.append("action", "activateFestival");
      fd.append("festivalId", festivalId);

      const res = await updateMandalRegistrationSettingsAdmin(fd);
      if (res && res.success) {
        toast({
          title: "Active Festival Changed",
          description: "Selected festival is now set to ACTIVE.",
          variant: "success",
        });
        loadSettings();
      }
    } catch (error) {
      console.error("Error activating festival:", error);
    }
  };

  // Delete Festival Handler
  const handleDeleteFestival = async (festivalId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete festival "${name}"?`)) return;
    try {
      const fd = new FormData();
      fd.append("action", "deleteFestival");
      fd.append("festivalId", festivalId);

      const res = await updateMandalRegistrationSettingsAdmin(fd);
      if (res && res.success) {
        toast({
          title: "Festival Deleted",
          description: `Festival "${name}" removed successfully.`,
        });
        loadSettings();
      }
    } catch (error) {
      console.error("Error deleting festival:", error);
    }
  };

  // Open View Modal
  const openViewModal = (festival: any) => {
    setViewingFestival(festival);
    setIsViewModalOpen(true);
  };

  // Open Form Modal for Create / Edit
  const openModal = (festival?: any) => {
    if (festival) {
      setEditingFestivalId(festival.id);
      setFormData({
        name: festival.name || festival.title?.en || "",
        title_en: festival.title?.en || "",
        title_hi: festival.title?.hi || "",
        title_mr: festival.title?.mr || "",
        subtitle_en: festival.subtitle?.en || "",
        subtitle_hi: festival.subtitle?.hi || "",
        subtitle_mr: festival.subtitle?.mr || "",
        startDate: festival.startDate || "",
        endDate: festival.endDate || "",
        isActive: !!festival.isActive,
      });

      if (festival.image) {
        const imgUrl = festival.image.startsWith("http")
          ? festival.image
          : `${BASE_URL}${festival.image}`;
        setImagePreview(imgUrl);
      } else {
        setImagePreview("");
      }
    } else {
      setEditingFestivalId(null);
      setFormData({
        name: "",
        title_en: "",
        title_hi: "",
        title_mr: "",
        subtitle_en: "",
        subtitle_hi: "",
        subtitle_mr: "",
        startDate: "",
        endDate: "",
        isActive: festivals.length === 0,
      });
      setImagePreview("");
    }
    setImageFile(null);
    setIsModalOpen(true);
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

  // Submit Festival Create / Edit Form
  const handleSubmitFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingFestival(true);
      const data = new FormData();
      data.append("action", "saveFestival");
      if (editingFestivalId) {
        data.append("id", editingFestivalId);
      }
      data.append("name", formData.name || formData.title_en || "Festival Registration");
      data.append("title_en", formData.title_en);
      data.append("title_hi", formData.title_hi);
      data.append("title_mr", formData.title_mr);
      data.append("subtitle_en", formData.subtitle_en);
      data.append("subtitle_hi", formData.subtitle_hi);
      data.append("subtitle_mr", formData.subtitle_mr);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("isActive", formData.isActive.toString());

      if (imageFile) {
        data.append("image", imageFile);
      } else if (imagePreview) {
        data.append("existingImage", imagePreview.replace(BASE_URL, ""));
      }

      const res = await updateMandalRegistrationSettingsAdmin(data);
      if (res && res.success) {
        toast({
          title: "Festival Saved",
          description: "Festival settings updated successfully.",
          variant: "success",
        });
        setIsModalOpen(false);
        loadSettings();
      } else {
        toast({
          title: "Save Failed",
          description: res.message || "Failed to save festival.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error saving festival settings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save festival",
        variant: "destructive",
      });
    } finally {
      setSavingFestival(false);
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
    <div className="space-y-8 w-full p-4 md:p-8">
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
            Two-Level Control: Manage Global Public Toggle and Festival-level Active Settings.
          </p>
        </div>
        <Badge
          variant={globalEnabled ? "default" : "outline"}
          className={`px-4 py-1.5 text-sm font-semibold self-start md:self-center ${
            globalEnabled ? "bg-green-600 hover:bg-green-700 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
        >
          {globalEnabled ? "Global System: ONLINE" : "Global System: OFF"}
        </Badge>
      </div>

      {/* Level 1: Global Master Switch Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/30 transition-all">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <Label htmlFor="global-switch" className="text-lg font-bold text-foreground cursor-pointer">
              Level 1: Global Mandal Registration Toggle
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Master switch to enable or disable Mandal Registration across the entire public platform.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 px-5 py-3 rounded-xl border border-border shrink-0">
          <span
            className={`text-sm font-bold ${
              globalEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {savingGlobal ? "SAVING..." : globalEnabled ? "ENABLED" : "DISABLED"}
          </span>
          <Switch
            id="global-switch"
            checked={globalEnabled}
            disabled={savingGlobal}
            onCheckedChange={handleToggleGlobal}
            className="scale-125"
          />
        </div>
      </div>

      {/* Level 2: Stored Festivals List Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Level 2: Festival Registration Configurations
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Multiple festivals can be created, but only <b>ONE</b> festival can be active at a time.
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl gap-2 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Festival
          </Button>
        </div>

        {/* Festival Cards List */}
        {festivals.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-3 bg-muted/20">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <div className="text-sm font-semibold text-foreground">No Festival Configurations Found</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click "Add New Festival" to create your first festive registration campaign (e.g. Ganesh Utsav 2026).
            </p>
            <Button onClick={() => openModal()} variant="outline" size="sm" className="gap-1 mt-2">
              <Plus className="w-3.5 h-3.5" />
              Create Festival
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {festivals.map((fest: any) => {
              const isActive = fest.isActive;
              return (
                <div
                  key={fest.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                      : "bg-background border-border hover:border-muted-foreground/30"
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    {fest.image ? (
                      <img
                        src={fest.image.startsWith("http") ? fest.image : `${BASE_URL}${fest.image}`}
                        alt={fest.name}
                        className="w-20 h-14 object-cover rounded-xl border shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded-xl border flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-foreground">
                          {fest.name || fest.title?.en || "Festival Campaign"}
                        </h3>
                        {isActive && (
                          <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {fest.subtitle?.en || fest.title?.en}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          {fest.startDate && fest.endDate
                            ? `${fest.startDate} to ${fest.endDate}`
                            : "No dates specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateFestival(fest.id)}
                        className="h-9 px-3 text-xs font-semibold border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-300 gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openViewModal(fest)}
                      className="h-9 px-3 text-xs font-semibold gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(fest)}
                      className="h-9 px-3 text-xs font-semibold gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                     
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFestival(fest.id, fest.name || "Festival")}
                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW FESTIVAL DETAILS DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Festival Details
            </DialogTitle>
            <DialogDescription>
              Preview of festival settings and public registration banner information.
            </DialogDescription>
          </DialogHeader>

          {viewingFestival && (
            <div className="space-y-6 pt-2">
              {/* Banner Image */}
              {viewingFestival.image ? (
                <div className="w-full h-44 bg-muted rounded-xl overflow-hidden border">
                  <img
                    src={
                      viewingFestival.image.startsWith("http")
                        ? viewingFestival.image
                        : `${BASE_URL}${viewingFestival.image}`
                    }
                    alt={viewingFestival.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-28 bg-muted rounded-xl border flex items-center justify-center text-muted-foreground text-sm">
                  No Banner Uploaded
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-muted/10">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Festival Name</span>
                  <p className="font-bold text-foreground text-sm">{viewingFestival.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Status</span>
                  <div className="mt-0.5">
                    {viewingFestival.isActive ? (
                      <Badge className="bg-amber-600 text-white font-bold text-xs">ACTIVE</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">INACTIVE</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground">Date Range</span>
                  <p className="font-semibold text-foreground text-sm">
                    {viewingFestival.startDate && viewingFestival.endDate
                      ? `${viewingFestival.startDate}  to  ${viewingFestival.endDate}`
                      : "Not set"}
                  </p>
                </div>
              </div>

              {/* Multilingual Titles & Subtitles View */}
              <div className="space-y-3 border p-4 rounded-xl">
                <h4 className="font-bold text-sm text-foreground">Multilingual Content</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">English:</span>{" "}
                    <span className="font-medium text-foreground">{viewingFestival.title?.en || "N/A"}</span>
                    {viewingFestival.subtitle?.en && (
                      <p className="text-muted-foreground mt-0.5">{viewingFestival.subtitle.en}</p>
                    )}
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">Hindi:</span>{" "}
                    <span className="font-medium text-foreground">{viewingFestival.title?.hi || "N/A"}</span>
                    {viewingFestival.subtitle?.hi && (
                      <p className="text-muted-foreground mt-0.5">{viewingFestival.subtitle.hi}</p>
                    )}
                  </div>
                  <div className="p-2 bg-muted/30 rounded-lg">
                    <span className="font-bold text-primary">Marathi:</span>{" "}
                    <span className="font-medium text-foreground">{viewingFestival.title?.mr || "N/A"}</span>
                    {viewingFestival.subtitle?.mr && (
                      <p className="text-muted-foreground mt-0.5">{viewingFestival.subtitle.mr}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT FESTIVAL DIALOG FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingFestivalId ? "Edit Festival Settings" : "Add New Festival Settings"}
            </DialogTitle>
            <DialogDescription>
              Configure festive titles, banner image, date range, and activation status for Mandal registration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFestival} className="space-y-6 pt-2">
            {/* Festival Identifier Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Festival Identifier Name</Label>
              <Input
                placeholder="e.g. Ganesh Utsav 2026 / Navratri 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Multilingual Titles & Subtitles */}
            <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Multilingual Title & Subtitle Details
              </Label>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-xs h-9 bg-muted p-0.5 rounded-lg">
                  <TabsTrigger value="en" className="text-xs font-bold">English</TabsTrigger>
                  <TabsTrigger value="hi" className="text-xs font-bold">Hindi</TabsTrigger>
                  <TabsTrigger value="mr" className="text-xs font-bold">Marathi</TabsTrigger>
                </TabsList>

                {(["en", "hi", "mr"] as const).map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Title ({lang.toUpperCase()})</Label>
                      <Input
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
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Subtitle ({lang.toUpperCase()})</Label>
                      <Input
                        placeholder={
                          lang === "hi"
                            ? "उदा. अपने मंडल को अब पंजीकृत करें"
                            : lang === "mr"
                            ? "उदा. तुमचे मंडळ आताच नोंदवा"
                            : "e.g. Register your Mandal today and connect with devotees"
                        }
                        value={(formData as any)[`subtitle_${lang}`]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`subtitle_${lang}`]: e.target.value })
                        }
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Dates & Active Checkbox */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Festival Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Festival End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="space-y-2 border rounded-xl p-4 bg-muted/20">
              <Label className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Festival Banner Graphic (1920x600 px)
              </Label>

              <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/40 cursor-pointer relative">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">Click to upload banner image</span>
                <Input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>

              {imagePreview && (
                <div className="relative w-full h-32 bg-muted rounded-xl overflow-hidden border">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full text-foreground hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Set Active Checkbox */}
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
              <input
                type="checkbox"
                id="is-active-check"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="is-active-check" className="text-xs font-bold cursor-pointer text-amber-900 dark:text-amber-200">
                Set as Currently ACTIVE Festival (Deactivates other festivals)
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingFestival} className="bg-primary text-primary-foreground gap-2">
                {savingFestival ? "Saving..." : "Save Festival Settings"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

