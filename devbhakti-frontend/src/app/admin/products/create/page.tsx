"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Store,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createProductAdmin, fetchAllTemplesAdmin, fetchActiveCategoriesAdmin, fetchAllSellersAdmin } from "@/api/adminController";

interface Variant {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  image?: string | null;
  imageFile?: File | null;
  imagePreview?: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    templeId: "",
    status: "pending" as "pending" | "approved" | "rejected",
    highlights: "",
    longDescription: "",
    shippingInfo: "Ships in 24-48 Hours",
    origin: "India",
    rating: "4.5",
  });

  const [variants, setVariants] = useState<Variant[]>([
    { id: "1", name: "", price: 0, costPrice: 0, stock: 0, imageFile: null, imagePreview: "" }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVendors();
    loadCategories();
  }, []);

  const loadVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const [templesData, sellersData] = await Promise.all([
        fetchAllTemplesAdmin(),
        fetchAllSellersAdmin()
      ]);

      const formattedTemples = templesData
        .filter((user: any) => user.temple)
        .map((user: any) => ({
          id: user.temple.id,
          name: user.temple.name,
          role: "TEMPLE",
          icon: <Building2 className="w-4 h-4 text-primary" />
        }));

      const formattedSellers = sellersData
        .filter((seller: any) => seller.templeId)
        .map((seller: any) => ({
          id: seller.templeId,
          name: seller.storeName,
          role: "SELLER",
          icon: <Store className="w-4 h-4 text-blue-600" />
        }));

      const allVendors = [
        { id: "general", name: "DevBhakti Exclusive", role: "ADMIN", icon: <ShieldCheck className="w-4 h-4 text-amber-600" /> },
        ...formattedTemples,
        ...formattedSellers
      ];

      setVendors(allVendors);
    } catch (error: any) {
      console.error("Load Vendors Error:", error);
      setVendors([{ id: "general", name: "DevBhakti Exclusive", role: "ADMIN", icon: <ShieldCheck className="w-4 h-4 text-amber-600" /> }]);
      toast({
        title: "Warning",
        description: "Could not load all vendors. Some options might be missing.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await fetchActiveCategoriesAdmin();
      setCategories(data);
    } catch (error: any) {
      console.error("Load Categories Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load categories";

      toast({
        title: "Warning",
        description: `Could not load categories: ${errorMessage}. Please check category management.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProductImage = () => {
    setProductImage(null);
    setProductImagePreview("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    // templeId is now optional for admin

    // Validate variants
    const validVariants = variants.filter(v => v.name.trim() && v.price > 0);
    if (validVariants.length === 0) {
      newErrors.variants = "At least one valid variant is required";
    }

    validVariants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        newErrors[`variant_name_${index}`] = "Variant name is required";
      }
      if (variant.price <= 0) {
        newErrors[`variant_price_${index}`] = "Price must be greater than 0";
      }
      if (variant.stock < 0) {
        newErrors[`variant_stock_${index}`] = "Stock cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const validVariants = variants.filter(v => v.name.trim() && v.price > 0);

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add basic product data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);

      // Add templeId (null for general products)
      if (formData.templeId !== "general") {
        formDataToSend.append('templeId', formData.templeId);
      }

      // Add product image if exists
      if (productImage) {
        formDataToSend.append('image', productImage);
      }

      // Add additional details
      formDataToSend.append('highlights', formData.highlights);
      formDataToSend.append('longDescription', formData.longDescription);
      formDataToSend.append('shippingInfo', formData.shippingInfo);
      formDataToSend.append('origin', formData.origin);
      formDataToSend.append('rating', formData.rating);

      // Add variants with costPrice as JSON string and handle images
      const variantsData = validVariants.map((v, index) => {
        if (v.imageFile) {
          formDataToSend.append(`variant_image_${index}`, v.imageFile);
        }
        return {
          name: v.name,
          price: v.price,
          costPrice: v.costPrice || null,
          stock: v.stock,
          image: v.imageFile ? null : (v.imagePreview || null)
        };
      });
      formDataToSend.append('variants', JSON.stringify(variantsData));

      await createProductAdmin(formDataToSend);

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      router.push("/admin/products");
    } catch (error: any) {
      console.error("Create Product Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create product";
      const errorDetails = error?.response?.data?.details;

      toast({
        title: "Error Creating Product",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: "",
      price: 0,
      costPrice: 0,
      stock: 0,
      imageFile: null,
      imagePreview: ""
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
    setVariants(variants.map(variant =>
      variant.id === id
        ? { ...variant, [field]: field === 'price' || field === 'stock' || field === 'costPrice' ? Number(value) : value }
        : variant
    ));
  };

  const handleVariantImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Image size should be less than 5MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariants(variants.map(variant =>
          variant.id === id ? { ...variant, imageFile: file, imagePreview: reader.result as string } : variant
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVariantImage = (id: string) => {
    setVariants(variants.map(variant =>
      variant.id === id ? { ...variant, imageFile: null, imagePreview: "" } : variant
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Product</h1>
          <p className="text-muted-foreground">Add a new product with variants and pricing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  {productImagePreview ? (
                    <div className="relative">
                      <img
                        src={productImagePreview}
                        alt="Product preview"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeProductImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-[10px] font-semibold text-primary mt-1">Recommended: 800x800 px (Square)</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      JPG, PNG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temple">Product Owner / Vendor *</Label>
                  <Select
                    value={formData.templeId}
                    onValueChange={(value) => setFormData({ ...formData, templeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Owner/Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            {vendor.icon}
                            <span>{vendor.name}</span>
                            <span className="text-[10px] font-bold uppercase py-0.5 px-1 bg-slate-100 rounded text-slate-500 ml-auto">
                              {vendor.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "pending" | "approved" | "rejected") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Base Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin / Source</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., India, Varanasi, Haridwar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingInfo">Shipping Label</Label>
                  <Input
                    id="shippingInfo"
                    value={formData.shippingInfo}
                    onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
                    placeholder="e.g., Ships in 24-48 Hours"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlights">Product Highlights (Comma separated)</Label>
                <Textarea
                  id="highlights"
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Pure Brass, Handcrafted, Blessed by Priests..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription">Detailed Product Description / Benefits</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Explain the significance, usage, and benefits in detail..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Product Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Variants:</span>
                  <span className="font-medium">{variants.filter(v => v.name.trim()).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Range:</span>
                  <span className="font-medium">
                    {variants.filter(v => v.price > 0).length > 0
                      ? `₹${Math.min(...variants.filter(v => v.price > 0).map(v => v.price))} - ₹${Math.max(...variants.filter(v => v.price > 0).map(v => v.price))}`
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Stock:</span>
                  <span className="font-medium">
                    {variants.reduce((sum, v) => sum + v.stock, 0)} units
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variants Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Variants</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
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
                    <h4 className="font-semibold text-sm">Variant {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVariant(variant.id)}
                      disabled={variants.length === 1}
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Variant Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`variant-name-${variant.id}`}>Variant Name *</Label>
                      <Input
                        id={`variant-name-${variant.id}`}
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                        placeholder="e.g., Small, Red, 100ml"
                        className={errors[`variant_name_${index}`] ? "border-red-500" : ""}
                      />
                      {errors[`variant_name_${index}`] && (
                        <p className="text-sm text-red-500">{errors[`variant_name_${index}`]}</p>
                      )}
                    </div>

                    {/* Variant Image */}
                    <div className="space-y-2">
                      <Label>Variant Image</Label>
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
                          <p className="text-[10px] font-semibold text-primary mt-0.5">Recommended: 800x800 px</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Max 5MB</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Selling Price */}
                    <div className="space-y-2">
                      <Label htmlFor={`variant-price-${variant.id}`}>Selling Price (₹) *</Label>
                      <Input
                        id={`variant-price-${variant.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price || ""}
                        onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                        placeholder="0.00"
                        className={errors[`variant_price_${index}`] ? "border-red-500" : ""}
                      />
                      {errors[`variant_price_${index}`] && (
                        <p className="text-sm text-red-500">{errors[`variant_price_${index}`]}</p>
                      )}
                    </div>

                    {/* Cost Price */}
                    <div className="space-y-2">
                      <Label htmlFor={`variant-cost-${variant.id}`}>Cost Price (₹)</Label>
                      <Input
                        id={`variant-cost-${variant.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.costPrice || ""}
                        onChange={(e) => updateVariant(variant.id, 'costPrice', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                      <Label htmlFor={`variant-stock-${variant.id}`}>Stock Quantity *</Label>
                      <Input
                        id={`variant-stock-${variant.id}`}
                        type="number"
                        min="0"
                        value={variant.stock || ""}
                        onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                        placeholder="0"
                        className={errors[`variant_stock_${index}`] ? "border-red-500" : ""}
                      />
                      {errors[`variant_stock_${index}`] && (
                        <p className="text-sm text-red-500">{errors[`variant_stock_${index}`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Profit Margin Display */}
                  {variant.price > 0 && variant.costPrice && variant.costPrice > 0 && (
                    <div className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Profit Margin: ₹{(variant.price - variant.costPrice).toFixed(2)}
                        ({(((variant.price - variant.costPrice) / variant.price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
