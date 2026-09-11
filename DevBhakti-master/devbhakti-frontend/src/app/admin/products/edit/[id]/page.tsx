"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Save,
  X,
  Image as ImageIcon,
  ShieldCheck,
  Store,
  Landmark,
  Building2,
  Check,
  ChevronsUpDown,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { useLanguage, Language } from "@/context/LanguageContext";
import {
  fetchProductByIdAdmin,
  updateProductAdmin,
  fetchAllTemplesAdmin,
  fetchActiveCategoriesAdmin,
  fetchAllSellersAdmin,
  fetchAllMandalsAdmin,
} from "@/api/adminController";
import { parseLocalizedValue } from "@/utils/textUtils";

interface Variant {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  price: number;
  stock: number;
  image?: string | null;
  imageFile?: File | null;
  imagePreview?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sourcePage = searchParams.get("page") || "1";
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeFormLang, setActiveFormLang] = useState<Language>("en");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [showVariantCropper, setShowVariantCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [tempVariantImage, setTempVariantImage] = useState<string | null>(null);
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");

  const filteredVendors = vendors.filter((v) => {
    if (!vendorSearch.trim()) return true;
    const q = vendorSearch.toLowerCase().trim();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.role?.toLowerCase().includes(q) ||
      v.searchText?.toLowerCase().includes(q)
    );
  });

  const [formData, setFormData] = useState({
    name_en: "",
    name_hi: "",
    name_mr: "",
    description_en: "",
    description_hi: "",
    description_mr: "",
    highlights_en: "",
    highlights_hi: "",
    highlights_mr: "",
    shippingInfo_en: "Ships in 24-48 Hours",
    shippingInfo_hi: "",
    shippingInfo_mr: "",
    origin_en: "India",
    origin_hi: "",
    origin_mr: "",
    // Global
    category: "",
    templeId: "",
    status: "pending" as "pending" | "approved" | "rejected",
    rating: "4.5",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVendors();
    loadCategories();
    if (params.id) loadProduct(params.id as string);
  }, [params.id]);

  const loadVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const [templesData, sellersData, mandalsRes] = await Promise.all([
        fetchAllTemplesAdmin({ isVerified: true, isActive: true }),
        fetchAllSellersAdmin(),
        fetchAllMandalsAdmin({ isActive: true, status: 'APPROVED' })
      ]);
      const formattedTemples = (templesData || [])
        .filter((user: any) => user?.temple?.id)
        .map((user: any) => ({
          id: user.temple.id,
          name: parseLocalizedValue(user.temple.name_en || user.temple.name, "en"),
          role: "TEMPLE",
          icon: <Building2 className="w-4 h-4 text-primary" />,
          searchText: `${user.temple.name_en || user.temple.name} temple institution`,
        }));
      const formattedSellers = (sellersData || [])
        .filter((seller: any) => seller?.sellerId)
        .map((seller: any) => ({
          id: seller.sellerId,
          name: parseLocalizedValue(seller.storeName),
          role: "SELLER",
          icon: <Store className="w-4 h-4 text-blue-600" />,
          searchText: `${seller.storeName} seller vendor store`,
        }));

      const mandalsData = mandalsRes?.data?.mandals || mandalsRes?.data || [];
      const formattedMandals = (Array.isArray(mandalsData) ? mandalsData : [])
        .filter((mandal: any) => mandal?.id)
        .map((mandal: any) => ({
          id: mandal.id,
          name: parseLocalizedValue(mandal.name, "en"),
          role: "MANDAL",
          icon: <Landmark className="w-4 h-4 text-orange-600" />,
          searchText: `${parseLocalizedValue(mandal.name, "en")} mandal samiti`,
        }));

      setVendors([
        { id: "general", name: "DevBhakti Exclusive", role: "DevBhakti Admin", icon: <ShieldCheck className="w-4 h-4 text-amber-600" />, searchText: "devbhakti exclusive admin general" },
        ...formattedTemples,
        ...formattedSellers,
        ...formattedMandals,
      ]);
    } catch {
      setVendors([{ id: "general", name: "DevBhakti Exclusive", role: "ADMIN", icon: <ShieldCheck className="w-4 h-4 text-amber-600" /> }]);
      toast({ title: "Warning", description: "Could not load all vendors.", variant: "destructive" });
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await fetchActiveCategoriesAdmin();
      setCategories(data);
    } catch {
      toast({ title: "Warning", description: "Could not load categories.", variant: "destructive" });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await fetchProductByIdAdmin(id);
      setFormData({
        name_en: data.name?.en || data.name_en || "",
        name_hi: data.name?.hi || data.name_hi || "",
        name_mr: data.name?.mr || data.name_mr || "",
        description_en: data.description?.en || data.description_en || "",
        description_hi: data.description?.hi || data.description_hi || "",
        description_mr: data.description?.mr || data.description_mr || "",
        highlights_en: data.highlights?.en || data.highlights_en || "",
        highlights_hi: data.highlights?.hi || data.highlights_hi || "",
        highlights_mr: data.highlights?.mr || data.highlights_mr || "",
        shippingInfo_en: data.shippingInfo?.en || data.shippingInfo_en || "Ships in 24-48 Hours",
        shippingInfo_hi: data.shippingInfo?.hi || data.shippingInfo_hi || "",
        shippingInfo_mr: data.shippingInfo?.mr || data.shippingInfo_mr || "",
        origin_en: data.origin?.en || data.origin_en || "India",
        origin_hi: data.origin?.hi || data.origin_hi || "",
        origin_mr: data.origin?.mr || data.origin_mr || "",
        category: data.categoryId || "",
        templeId: data.templeId || data.sellerId || data.mandalId || "general",
        status: data.status,
        rating: data.rating?.toString() || "4.5",
        weight: data.weight?.toString() || "",
        length: data.length?.toString() || "",
        width: data.width?.toString() || "",
        height: data.height?.toString() || "",
      });
      setVariants(
        (data.variants || []).filter((v: any) => v.isActive !== false).map((v: any) => ({
          id: v.id,
          name_en: v.name?.en || v.name_en || "",
          name_hi: v.name?.hi || v.name_hi || "",
          name_mr: v.name?.mr || v.name_mr || "",
          price: v.price,
          stock: v.stock,
          image: v.image,
          imagePreview: v.image ? `${BASE_URL}${v.image}` : "",
        }))
      );
      if (data.image) setExistingImage(data.image);
      // Update breadcrumb with product name
      const productName = parseLocalizedValue(data.name) || "Edit Product";
      window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: `Edit: ${productName}` }));
    } catch (error: any) {
      toast({ title: "Error Loading Product", description: error?.response?.data?.message || "Failed to load product", variant: "destructive" });
      router.push(`/admin/products?page=${sourcePage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast({ title: "Invalid File", description: "Image files only", variant: "destructive" }); return; }
      if (file.size > 5 * 1024 * 1024) { toast({ title: "File Too Large", description: "Max 5MB", variant: "destructive" }); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setTempImage(reader.result as string); setShowCropper(true); };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setProductImage(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => { setProductImagePreview(reader.result as string); setShowCropper(false); setTempImage(null); };
    reader.readAsDataURL(croppedFile);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name_en.trim()) newErrors.name_en = "Product name (English) is required";
    if (!formData.description_en.trim()) newErrors.description_en = "Description (English) is required";
    if (!formData.category) newErrors.category = "Category is required";
    const validVariants = variants.filter((v) => v.name_en.trim() && v.price > 0);
    if (validVariants.length === 0) newErrors.variants = "At least one valid variant (with English name) is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fill required fields in English tab", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const validVariants = variants.filter((v) => v.name_en.trim() && v.price > 0);
      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => fd.append(key, String(value ?? "")));

      // Backward compat
      fd.append("name", formData.name_en);
      fd.append("description", formData.description_en);
      fd.append("highlights", formData.highlights_en);
      fd.append("shippingInfo", formData.shippingInfo_en);
      fd.append("origin", formData.origin_en);

      if (productImage) fd.append("image", productImage);
      if (!existingImage && !productImage) fd.append("removeImage", "true");

      // Determine vendor type and append appropriate field
      if (formData.templeId && formData.templeId !== "general") {
        const selectedVendor = vendors.find(v => v.id === formData.templeId);
        if (selectedVendor?.role === "MANDAL") {
          fd.append('mandalId', formData.templeId);
          // Clear templeId from the FormData so backend doesn't use it for temple/seller lookup
          fd.delete('templeId');
          fd.append('templeId', '');
        }
      }

      const variantsData = validVariants.map((v, index) => {
        if (v.imageFile) fd.append(`variant_image_${index}`, v.imageFile);
        return {
          id: v.id,
          name_en: v.name_en,
          name_hi: v.name_hi,
          name_mr: v.name_mr,
          name: v.name_en,
          price: v.price,
          stock: v.stock,
          image: v.imageFile ? null : v.image || null,
        };
      });
      fd.append("variants", JSON.stringify(variantsData));

      await updateProductAdmin(params.id as string, fd);
      toast({ title: "Success", description: "Product updated successfully" });
      router.push(`/admin/products?page=${sourcePage}`);
    } catch (error: any) {
      toast({ title: "Error Updating Product", description: error?.response?.data?.message || "Failed to update product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariant = () =>
    setVariants([...variants, { id: Date.now().toString(), name_en: "", name_hi: "", name_mr: "", price: 0, stock: 0, imageFile: null, imagePreview: "", image: null }]);

  const removeVariant = (id: string) => { if (variants.length > 1) setVariants(variants.filter((v) => v.id !== id)); };

  const updateVariant = (id: string, field: keyof Variant, value: string | number) =>
    setVariants(variants.map((v) => v.id === id ? { ...v, [field]: (field === "price" || field === "stock") ? Number(value) : value } : v));

  const handleVariantImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast({ title: "Invalid File", description: "Image files only", variant: "destructive" }); return; }
      if (file.size > 5 * 1024 * 1024) { toast({ title: "File Too Large", description: "Max 5MB", variant: "destructive" }); return; }
      
      setCurrentVariantId(id);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempVariantImage(reader.result as string);
        setShowVariantCropper(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleVariantCropComplete = (croppedFile: File) => {
    if (!currentVariantId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVariants(variants.map((v) => 
        v.id === currentVariantId 
          ? { ...v, imageFile: croppedFile, imagePreview: reader.result as string, image: null } 
          : v
      ));
      setShowVariantCropper(false);
      setTempVariantImage(null);
      setCurrentVariantId(null);
    };
    reader.readAsDataURL(croppedFile);
  };

  const removeVariantImage = (id: string) =>
    setVariants(variants.map((v) => v.id === id ? { ...v, imageFile: null, imagePreview: "", image: null } : v));

  const f = (base: string, lang: string) => `${base}_${lang}` as keyof typeof formData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => { setShowCropper(false); setTempImage(null); }}
          initialAspect={1}
          lockAspect={true}
          title="Adjust Product Image"
        />
      )}

      {showVariantCropper && tempVariantImage && (
        <ImageCropper
          image={tempVariantImage}
          onCropComplete={handleVariantCropComplete}
          onCancel={() => { setShowVariantCropper(false); setTempVariantImage(null); setCurrentVariantId(null); }}
          initialAspect={1}
          lockAspect={true}
          title="Adjust Variant Image"
        />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/products?page=${sourcePage}`)} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and variants</p>
        </div>
      </div>

      {/* ── LANGUAGE TABS (same as TempleForm) ── */}
      <Tabs value={activeFormLang} onValueChange={(v) => setActiveFormLang(v as Language)} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="en">English (EN)</TabsTrigger>
          <TabsTrigger value="hi">हिंदी (HI)</TabsTrigger>
          <TabsTrigger value="mr">मराठी (MR)</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(["en", "hi", "mr"] as Language[]).map((lang) => (
            <TabsContent key={lang} value={lang} className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info — language fields */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {t("admin.products.basic_info")}
                      {lang !== "en" && <span className="text-xs text-muted-foreground font-normal ml-2">{t("admin.products.fallback_hint")}</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("admin.products.product_name")} {lang === "en" && <span className="text-red-500">*</span>}</Label>
                      <Input
                        value={formData[f("name", lang)]}
                        onChange={(e) => setFormData({ ...formData, [f("name", lang)]: e.target.value })}
                        placeholder={lang === "en" ? "Enter product name" : `${t("admin.products.product_name")}...`}
                        className={lang === "en" && errors.name_en ? "border-red-500" : ""}
                      />
                      {lang === "en" && errors.name_en && <p className="text-sm text-red-500">{errors.name_en}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>{t("admin.products.description")} {lang === "en" && <span className="text-red-500">*</span>}</Label>
                      <RichTextEditor
                        value={formData[f("description", lang)]}
                        onChange={(html) => setFormData({ ...formData, [f("description", lang)]: html })}
                        placeholder={lang === "en" ? "Enter product description" : `${t("admin.products.description")}...`}
                        minHeight="150px"
                        className={lang === "en" && errors.description_en ? "border-red-500" : ""}
                      />
                      {lang === "en" && errors.description_en && <p className="text-sm text-red-500">{errors.description_en}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>{t("admin.products.highlights")}</Label>
                      <Textarea
                        value={formData[f("highlights", lang)]}
                        onChange={(e) => setFormData({ ...formData, [f("highlights", lang)]: e.target.value })}
                        placeholder={lang === "en" ? "Pure Brass, Handcrafted, Blessed by Priests..." : `${t("admin.products.highlights")}...`}
                        rows={2}
                      />
                    </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("admin.products.origin")}</Label>
                        <Input
                          value={formData[f("origin", lang)]}
                          onChange={(e) => setFormData({ ...formData, [f("origin", lang)]: e.target.value })}
                          placeholder={lang === "en" ? "e.g., India, Varanasi" : `${t("admin.products.origin")}...`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("admin.products.shipping_label")}</Label>
                        <Input
                          value={formData[f("shippingInfo", lang)]}
                          onChange={(e) => setFormData({ ...formData, [f("shippingInfo", lang)]: e.target.value })}
                          placeholder={lang === "en" ? "Ships in 24-48 Hours" : `${t("admin.products.shipping_label")}...`}
                        />
                      </div>
                    </div> 
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader><CardTitle>{t("admin.products.summary")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("admin.products.total_variants")}:</span>
                        <span className="font-medium">{variants.filter((v) => v.name_en.trim()).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("admin.products.price_range")}:</span>
                        <span className="font-medium">
                          {variants.filter((v) => v.price > 0).length > 0
                            ? `₹${Math.min(...variants.filter((v) => v.price > 0).map((v) => v.price))} - ₹${Math.max(...variants.filter((v) => v.price > 0).map((v) => v.price))}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("admin.products.total_stock")}:</span>
                        <span className="font-medium">{variants.reduce((s, v) => s + v.stock, 0)} units</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                      <p>🇬🇧 {formData.name_en || <span className="italic">{t("admin.products.no_en_name")}</span>}</p>
                      <p>🇮🇳 {formData.name_hi || <span className="italic text-slate-400">{t("admin.products.no_hi_name")}</span>}</p>
                      <p>🟠 {formData.name_mr || <span className="italic text-slate-400">{t("admin.products.no_mr_name")}</span>}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings now available in all tabs per user request */}
              
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {t("admin.products.settings")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-2">
                          <Label>{t("admin.products.category")} *</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} disabled={isLoadingCategories}>
                            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                              <SelectValue placeholder={t("admin.products.select_category")} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{parseLocalizedValue(c.name, lang)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                          <Label>{t("admin.products.status")}</Label>
                          <Select value={formData.status} onValueChange={(value: "pending" | "approved" | "rejected") => setFormData({ ...formData, status: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{t("admin.products.pending")}</SelectItem>
                              <SelectItem value="approved">{t("admin.products.approved")}</SelectItem>
                              <SelectItem value="rejected">{t("admin.products.rejected")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Vendor */}
                        <div className="space-y-2">
                          <Label>{t("admin.products.vendor")}</Label>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between font-normal hover:bg-white">
                                {formData.templeId ? (
                                  <div className="flex items-center gap-2">
                                    {vendors.find((v) => v.id === formData.templeId)?.icon}
                                    <span>{vendors.find((v) => v.id === formData.templeId)?.name}</span>
                                  </div>
                                ) : t("admin.products.select_vendor")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <div className="p-2 border-b">
                                <Input
                                  placeholder="Search owner or vendor..."
                                  value={vendorSearch}
                                  onChange={(e) => setVendorSearch(e.target.value)}
                                  className="h-8 text-xs focus:ring-1 focus:ring-amber-500"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                                {filteredVendors.length === 0 ? (
                                  <p className="text-xs text-slate-400 py-4 text-center">No owner or vendor found</p>
                                ) : (
                                  filteredVendors.map((vendor) => (
                                    <div
                                      key={vendor.id}
                                      onClick={() => {
                                        setFormData({ ...formData, templeId: vendor.id });
                                        setOpen(false);
                                        setVendorSearch("");
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-amber-50/80 transition-colors",
                                        formData.templeId === vendor.id ? "bg-amber-100/70 text-amber-900 font-semibold" : "text-slate-700"
                                      )}
                                    >
                                      {vendor.icon}
                                      <span className="flex-1 truncate">{vendor.name}</span>
                                      <span className="text-[10px] font-bold uppercase py-0.5 px-1 bg-slate-100 rounded text-slate-500 shrink-0">
                                        {vendor.role}
                                      </span>
                                      <Check className={cn("ml-1 h-3.5 w-3.5 text-amber-700", formData.templeId === vendor.id ? "opacity-100" : "opacity-0")} />
                                    </div>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Rating */}
                        <div className="space-y-2">
                          <Label>{t("admin.products.rating")}</Label>
                          <Input type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} />
                        </div>
                      </div>

                      {/* Product Image */}
                      <div className="space-y-2">
                        <Label>{t("marketplace.sacred_item")} {t("admin.products.image")}</Label>
                        <div className="flex items-center gap-4">
                          {productImagePreview || existingImage ? (
                            <div className="relative">
                              <img
                                src={productImagePreview || `${BASE_URL}${existingImage}`}
                                alt="Product"
                                className="w-24 h-24 object-cover rounded-lg border"
                              />
                              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => { setProductImage(null); setProductImagePreview(""); setExistingImage(""); }}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input type="file" accept="image/*" onChange={handleProductImageChange} className="cursor-pointer" />
                            <p className="text-[10px] font-semibold text-primary mt-1">{t("admin.products.aspect_ratio")}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{t("admin.products.file_hint")}</p>
                            {existingImage && !productImagePreview && <p className="text-xs text-green-600 mt-1">Current image loaded</p>}
                          </div>
                        </div>
                      </div>

                      {/* Dimensions */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Truck className="w-5 h-5" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">{t("admin.products.dimensions")}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2"><Label>{t("admin.products.weight")} *</Label><Input type="number" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0.5" /></div>
                          <div className="space-y-2"><Label>{t("admin.products.length")} *</Label><Input type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} placeholder="10" /></div>
                          <div className="space-y-2"><Label>{t("admin.products.width")} *</Label><Input type="number" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} placeholder="10" /></div>
                          <div className="space-y-2"><Label>{t("admin.products.height")} *</Label><Input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="10" /></div>
                        </div>
                        <p className="text-[10px] text-blue-600/70 font-medium">{t("admin.products.dim_note")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variants */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{t("admin.products.variants")}</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-primary text-primary hover:bg-primary/10">
                          <Plus className="w-4 h-4 mr-2" />{t("admin.products.add_variant")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {errors.variants && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{errors.variants}</p>
                        </div>
                      )}
                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div key={variant.id} className="p-4 border rounded-lg bg-slate-50 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-sm">{t("admin.products.variant")} {index + 1}</h4>
                              <Button type="button" variant="outline" size="icon" onClick={() => removeVariant(variant.id)} disabled={variants.length === 1} className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t("admin.products.variant_name")} {lang === "en" && <span className="text-red-500">*</span>}</Label>
                                <Input 
                                  value={variant[f("name", lang) as keyof Variant] as string} 
                                  onChange={(e) => updateVariant(variant.id, f("name", lang) as "name_en" | "name_hi" | "name_mr", e.target.value)} 
                                  placeholder={lang === "en" ? "e.g., Small, Red, 100ml" : `${t("admin.products.variant_name")}...`} 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.products.variant_image")}</Label>
                                <div className="flex items-center gap-3">
                                  {variant.imagePreview ? (
                                    <div className="relative">
                                      <img src={variant.imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                                      <Button type="button" variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full" onClick={() => removeVariantImage(variant.id)}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 border-2 border-dashed border-input rounded-md flex items-center justify-center">
                                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <Input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(variant.id, e)} className="cursor-pointer text-xs" />
                                    <p className="text-[10px] font-semibold text-primary mt-0.5">{t("admin.products.rec_size")}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>{t("admin.products.price")} *</Label>
                                <Input type="number" min="0" step="0.01" value={variant.price || ""} onChange={(e) => updateVariant(variant.id, "price", e.target.value)} placeholder="0.00" />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("admin.products.stock")} *</Label>
                                <Input type="number" min="0" value={variant.stock || ""} onChange={(e) => updateVariant(variant.id, "stock", e.target.value)} placeholder="0" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              
            </TabsContent>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/admin/products?page=${sourcePage}`)} disabled={isSubmitting}>{t("admin.products.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary">
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />{t("admin.products.saving")}</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />{t("admin.products.save_changes")}</>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
