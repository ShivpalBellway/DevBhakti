"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Save,
  X,
  Upload,
  Image as ImageIcon,
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
import { useToast } from "@/hooks/use-toast";
import { 
  fetchProductByIdAdmin,
  updateProductAdmin,
  fetchAllTemplesAdmin
} from "@/api/adminController";

// Temple categories
const categories = [
  "Idols",
  "Puja Items",
  "Books",
  "Clothing",
  "Prasad",
  "Accessories",
  "Other",
];

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  templeId: string;
  status: "pending" | "approved" | "rejected";
  image?: string;
  variants: Variant[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [temples, setTemples] = useState<any[]>([]);
  const [isLoadingTemples, setIsLoadingTemples] = useState(true);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  
  const [product, setProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    templeId: "",
    status: "pending" as "pending" | "approved" | "rejected",
  });
  
  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemples();
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadTemples = async () => {
    setIsLoadingTemples(true);
    try {
      const data = await fetchAllTemplesAdmin();
      // Transform temples data to match expected format
      const transformedTemples = [
        { id: "general", name: "General Products (No Temple)" },
        ...data.map((temple: any) => ({
          id: temple.templeId || temple.id,
          name: temple.templeName || temple.name
        }))
      ];
      setTemples(transformedTemples);
    } catch (error: any) {
      console.error("Load Temples Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load temples";
      
      // Fallback to general option only
      setTemples([{ id: "general", name: "General Products (No Temple)" }]);
      
      toast({
        title: "Warning",
        description: `Could not load temples: ${errorMessage}. Only general products available.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemples(false);
    }
  };

  const loadProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await fetchProductByIdAdmin(id);
      
      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description,
        category: data.category,
        templeId: data.templeId || "general", // Handle null templeId
        status: data.status,
      });
      setVariants(data.variants);
      
      // Set existing image if available
      if (data.image) {
        setExistingImage(data.image);
      }
      
    } catch (error: any) {
      console.error("Load Product Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load product";
      const errorDetails = error?.response?.data?.details;
      
      toast({
        title: "Error Loading Product",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });
      router.push("/admin/products");
    } finally {
      setIsLoading(false);
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

  const removeExistingImage = () => {
    setExistingImage("");
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
    if (!formData.templeId) {
      newErrors.templeId = "Temple is required";
    }

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
      
      // Add product image if new one is uploaded
      if (productImage) {
        formDataToSend.append('image', productImage);
      }
      
      // Add flag to remove existing image if needed
      if (!existingImage && !productImage && product?.image) {
        formDataToSend.append('removeImage', 'true');
      }
      
      // Add variants as JSON string
      formDataToSend.append('variants', JSON.stringify(validVariants));

      await updateProductAdmin(params.id as string, formDataToSend);
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Update Product Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update product";
      const errorDetails = error?.response?.data?.details;
      
      toast({
        title: "Error Updating Product",
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
      stock: 0,
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
        ? { ...variant, [field]: field === 'price' || field === 'stock' ? Number(value) : value }
        : variant
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-muted-foreground">Update product information and variants</p>
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
                        <SelectItem key={category} value={category}>
                          {category}
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
                  {(productImagePreview || existingImage) ? (
                    <div className="relative">
                      <img 
                        src={productImagePreview || (existingImage ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${existingImage}` : '')} 
                        alt="Product preview" 
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={productImagePreview ? removeProductImage : removeExistingImage}
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
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG, GIF up to 5MB
                    </p>
                    {existingImage && !productImagePreview && (
                      <p className="text-xs text-green-600 mt-1">
                        Current image loaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temple">Temple (Optional)</Label>
                  <Select
                    value={formData.templeId}
                    onValueChange={(value) => setFormData({ ...formData, templeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select temple (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {temples.map((temple) => (
                        <SelectItem key={temple.id} value={temple.id}>
                          {temple.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.templeId && <p className="text-sm text-red-500">{errors.templeId}</p>}
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
                  <span className="text-muted-foreground">Product ID:</span>
                  <span className="font-medium text-xs">{product.id}</span>
                </div>
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
                <div key={variant.id} className="flex items-center gap-4 p-4 border rounded-lg bg-slate-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`variant-name-${variant.id}`}>Variant Name *</Label>
                      <Input
                        id={`variant-name-${variant.id}`}
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                        placeholder="e.g., Small, Medium, Large"
                        className={errors[`variant_name_${index}`] ? "border-red-500" : ""}
                      />
                      {errors[`variant_name_${index}`] && (
                        <p className="text-sm text-red-500">{errors[`variant_name_${index}`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`variant-price-${variant.id}`}>Price (₹) *</Label>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor={`variant-stock-${variant.id}`}>Stock</Label>
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
                    
                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeVariant(variant.id)}
                          disabled={variants.length === 1}
                          className="h-10 w-10 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
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
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
