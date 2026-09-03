"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Package,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Store,
  Calendar as CalendarIcon,
  X,
  Filter,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from "lucide-react";
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLanguage } from "@/context/LanguageContext";
import { parseLocalizedValue, stripHtml } from "@/utils/textUtils";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchAllProductsAdmin,
  deleteProductAdmin,
  toggleProductStatusAdmin,
  fetchProductOwnersAdmin,
  createProductAdmin,
  fetchActiveCategoriesAdmin,
} from "@/api/adminController";

function ProductsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const qParam = searchParams.get("q");
  const pageParam = searchParams.get("page");

  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, outOfStock: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [isReturningFromEdit, setIsReturningFromEdit] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const { language, t } = useLanguage();

  const getLocalizedName = (item: any) => {
    if (!item) return "";
    // If it has properties like name_en, name_hi etc. (legacy or specific API format)
    if (item[`name_${language}`] || item.name_en || item.name_hi || item.name_mr) {
      return item[`name_${language}`] || item.name_en || item.name_hi || item.name_mr || "";
    }
    // Fallback to our new localized parser
    return parseLocalizedValue(item.name || item, language);
  };


  useEffect(() => {
    loadProducts();
    // Update URL without reloading
    const newPath = `/admin/products?page=${currentPage}${selectedOwner !== 'all' ? `&owner=${selectedOwner}` : ''}${selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}${searchTerm ? `&q=${searchTerm}` : ''}`;
    window.history.replaceState({ ...window.history.state, as: newPath, url: newPath }, '', newPath);
  }, [currentPage, selectedOwner, selectedStatus, selectedCategory, date]);

  useEffect(() => {
    if (qParam) setSearchTerm(qParam);
    else if (idParam) setSearchTerm(idParam);
    
    // If we have a page parameter, we're likely returning from edit
    if (pageParam && parseInt(pageParam) > 1) {
      setIsReturningFromEdit(true);
    }
  }, [idParam, qParam, pageParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't reset page if returning from edit page
      if (isReturningFromEdit) {
        setIsReturningFromEdit(false);
        loadProducts();
        return;
      }
      
      // Only reset to page 1 if there's a search term and we're not on page 1
      if (searchTerm && currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadProducts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isReturningFromEdit]);

  useEffect(() => {
    loadOwners();
    loadCategories();
  }, []);

  const loadOwners = async () => {
    try {
      const res = await fetchProductOwnersAdmin();
      if (res.success) {
        setOwners(res.data);
      }
    } catch (error) {
      console.error("Failed to load owners", error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchActiveCategoriesAdmin();
      if (Array.isArray(res)) {
        setCategories(res);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllProductsAdmin({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        productId: idParam || undefined,
        templeId: selectedOwner === "all" ? undefined : selectedOwner,
        date: date ? date.toISOString() : undefined,
        categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      });

      if (res.success) {
        setProducts(res.data.products);
        setStats(res.data.stats || { total: 0, pending: 0, approved: 0, outOfStock: 0 });
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error: any) {
      console.error("Load Products Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load products";
      toast({
        title: t("admin.products.list.error_loading") || "Error Loading Products",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("admin.products.list.delete_confirm"))) {
      try {
        await deleteProductAdmin(id);
        toast({ title: t("admin.products.list.success_delete"), description: t("admin.products.list.success_delete") });
        loadProducts();
      } catch (error: any) {
        console.error("Delete Product Error:", error);
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete product";
        const errorDetails = error?.response?.data?.details;

        toast({
          title: "Error Deleting Product",
          description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "approved" ? "pending" : "approved";
      await toggleProductStatusAdmin(id, newStatus);
      toast({
        title: t("admin.products.list.success_update") || "Success",
        description: `Product ${newStatus === "approved" ? t("admin.products.list.status_approved") : t("admin.products.list.status_pending")} successfully`
      });
      loadProducts();
    } catch (error: any) {
      console.error("Toggle Status Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update status";
      const errorDetails = error?.response?.data?.details;

      toast({
        title: "Error Updating Status",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    }
  };

  // No longer needed but kept for backward compatibility if any local filtering is still applied
  const filteredProducts = products;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-medium whitespace-nowrap">
            <CheckCircle className="w-3 h-3" />
            <span>{t("admin.products.list.status_approved")}</span>
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-xs font-medium whitespace-nowrap">
            <Clock className="w-3 h-3" />
            <span>{t("admin.products.list.status_pending")}</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs font-medium whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            <span>{t("admin.products.list.status_rejected")}</span>
          </div>
        );
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // --- BULK MANAGEMENT ---
  const downloadTemplate = () => {
    const template = [
      {
        "Name_EN": "Brass Ganesha Idol",
        "Name_HI": "पीतल गणेश मूर्ति",
        "Name_MR": "पितळी गणेश मूर्ती",
        "Description_EN": "Beautifully handcrafted brass idol.",
        "Description_HI": "खूबसूरती से तैयार की गई पीतल की मूर्ति।",
        "Description_MR": "सुंदर हाताने तयार केलेली पितळी मूर्ती.",
        "Category_ID": "CAT_ID_HERE",
        "Temple_ID": "TEMPLE_ID_HERE",
        "Status": "approved",
        "Price": 1500, // For simple single variant
        "Stock": 50,
        "Weight": "1kg",
        "Length": "10cm",
        "Width": "8cm",
        "Height": "15cm",
        "Variants": '[{"name_en": "Small", "name_hi": "छोटा", "price": 1200, "stock": 20}, {"name_en": "Large", "name_hi": "बड़ा", "price": 2500, "stock": 10}]',
        "Image_URL": "https://example.com/product.jpg"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product Template");
    XLSX.writeFile(wb, "Product_Import_Template.xlsx");
  };

  const handleExportExcel = () => {
    const exportData = products.map(p => ({
      "ID": p.id,
      "Name_EN": p.name_en || (p.name && p.name.en) || "",
      "Name_HI": p.name_hi || (p.name && p.name.hi) || "",
      "Name_MR": p.name_mr || (p.name && p.name.mr) || "",
      "Category": parseLocalizedValue(p.categoryObj?.name),
      "Category_ID": p.category,
      "Vendor_ID": p.templeId || p.sellerId || "",
      "Status": p.status,
      "Weight": p.weight,
      "Variants": JSON.stringify(p.variants || []),
      "Image_URL": p.image
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast({ title: "Error", description: "Excel file is empty", variant: "destructive" });
          return;
        }

        setIsImporting(true);
        setImportProgress({ total: data.length, current: 0, success: 0, failed: 0 });
        toast({ title: "Import Started", description: `Processing ${data.length} products...`, variant: "success" });
        
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          setImportProgress(p => ({ ...p, current: i + 1 }));
          try {
            const fd = new FormData();
            
            // Name & Description
            fd.append("name_en", String(row.Name_EN || "").trim());
            fd.append("name_hi", String(row.Name_HI || "").trim());
            fd.append("name_mr", String(row.Name_MR || "").trim());
            fd.append("description_en", String(row.Description_EN || "").trim());
            fd.append("description_hi", String(row.Description_HI || "").trim());
            fd.append("description_mr", String(row.Description_MR || "").trim());

            // Common fields
            fd.append("category", String(row.Category_ID || "").trim());
            fd.append("templeId", String(row.Temple_ID || "general").trim());
            fd.append("status", String(row.Status || "pending").toLowerCase());
            fd.append("weight", String(row.Weight || ""));
            fd.append("length", String(row.Length || ""));
            fd.append("width", String(row.Width || ""));
            fd.append("height", String(row.Height || ""));
            fd.append("origin_en", "India");
            fd.append("shippingInfo_en", "Ships in 24-48 Hours");

            // Variants
            let variantsData = [];
            if (row.Variants) {
              try {
                variantsData = typeof row.Variants === 'string' ? JSON.parse(row.Variants) : row.Variants;
              } catch (e) {
                console.warn(`Row ${i+2}: Failed to parse Variants JSON, falling back to simple variant`);
              }
            }
            
            if (!Array.isArray(variantsData) || variantsData.length === 0) {
              variantsData = [{
                name_en: "Default",
                price: parseFloat(String(row.Price || 0).replace(/[^0-9.]/g, "")),
                stock: parseInt(String(row.Stock || 0))
              }];
            }
            fd.append("variants", JSON.stringify(variantsData));

            if (row.Image_URL) fd.append("image_url", String(row.Image_URL));

            await createProductAdmin(fd);
            successCount++;
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
            console.error(`Row ${i + 2} failed:`, errorMsg);
            failCount++;
            toast({
              title: `Error in Row ${i + 2}`,
              description: errorMsg,
              variant: "destructive",
            });
          }
          setImportProgress(p => ({ ...p, success: successCount, failed: failCount }));
        }

        toast({
          title: "Import Complete",
          description: `Success: ${successCount}, Failed: ${failCount}`,
          variant: successCount > 0 ? "success" : "destructive"
        });
        loadProducts();
      } catch (error) {
        console.error("Import Error:", error);
        toast({ title: "Import Failed", description: "Failed to process Excel file", variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("admin.products.list.title")}</h1>
          <p className="text-slate-600">{t("admin.products.list.desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* <Button
            variant="outline"
            onClick={downloadTemplate}
            className="text-xs h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button> */}

          {/* <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImportExcel}
            />
            <Button variant="outline" className="text-xs h-9">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div> */}

          {/* <Button
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs h-9"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button> */}

          {hasPermission("products.create") && (
            <Button onClick={() => router.push('/admin/products/create')} className="bg-primary text-xs h-9">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.products.list.add_new")}
            </Button>
          )}
        </div>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-blue-900">Importing Products...</span>
            <span className="text-xs font-bold text-blue-700">{importProgress.current} / {importProgress.total}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="text-green-600">Success: {importProgress.success}</span>
            <span className="text-red-600">Failed: {importProgress.failed}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t("admin.products.list.stat_total") || "Total Products", value: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50", filter: "all" },
          { label: t("admin.products.list.stat_pending") || "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", filter: "pending" },
          { label: t("admin.products.list.stat_approved") || "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", filter: "approved" },
          { label: "Out of Stock", value: stats.outOfStock, icon: XCircle, color: "text-red-600", bg: "bg-red-50", filter: "out_of_stock" },
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className={cn(
              "bg-white border-slate-200 cursor-pointer transition-all hover:shadow-md",
              selectedStatus === stat.filter && "ring-2 ring-primary border-transparent"
            )}
            onClick={() => {
              setSelectedStatus(stat.filter);
              setCurrentPage(1);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.products.list.search_placeholder")}
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-full md:w-[160px]">
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[200px]">
            <Select value={selectedOwner} onValueChange={(val) => { setSelectedOwner(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("admin.products.list.filter_owner")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.products.list.all_owners")}</SelectItem>
                <SelectItem value="admin">DevBhakti Exclusive</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                        owner.type === 'Temple' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {owner.type}
                      </span>
                      {owner.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="w-full md:w-[180px]">
            <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {parseLocalizedValue(cat.name, language) || cat.nameSlug || cat.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] h-10 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{t("admin.products.list.filter_date")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(date || selectedOwner !== "all" || searchTerm || selectedCategory !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDate(undefined);
                  setSelectedOwner("all");
                  setSearchTerm("");
                  setSelectedStatus("all");
                  setSelectedCategory("all");
                }}
                className="h-10 w-10 text-muted-foreground"
                title={t("admin.products.list.clear_filters")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table className="table-fixed">
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[27%]">{t("admin.products.list.table_product")}</TableHead>
              <TableHead className="w-[12%]">{t("admin.products.list.table_category")}</TableHead>
              <TableHead className="w-[15%]">{t("admin.products.list.table_owner")}</TableHead>
              <TableHead className="w-[12%]">{t("admin.products.list.table_variants_pricing")}</TableHead>
              <TableHead className="w-[10%]">Stock</TableHead>
              <TableHead className="w-[10%]">{t("admin.products.list.table_status")}</TableHead>
              <TableHead className="w-[14%] text-right">{t("admin.products.list.table_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span>{t("admin.products.list.loading_data")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {t("admin.products.list.no_products")}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-14 aspect-[5/4] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={`${BASE_URL}${product.image}`}
                            alt={getLocalizedName(product)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">{getLocalizedName(product)}</span>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {truncateText(stripHtml(parseLocalizedValue(product.description, language)), 60)}
                          {stripHtml(parseLocalizedValue(product.description, language))?.length > 60 && (
                            <button
                              onClick={() => router.push(`/admin/products/${product.id}/view`)}
                              className="ml-1 text-primary hover:underline font-medium"
                            >
                              {t("admin.products.list.more")}
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <Badge variant="outline" className="max-w-full truncate font-medium">
                      {parseLocalizedValue(product.categoryObj?.name, language) || parseLocalizedValue(product.category, language) || "General"}
                    </Badge>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {product.mandal ? (
                        <div className="flex min-w-0 items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                          <Building2 className="w-3.5 h-3.5" />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Mandal</span>
                            <span className="truncate text-sm font-medium leading-none text-slate-700">{parseLocalizedValue(product.mandal.name, language)}</span>
                          </div>
                        </div>
                      ) : product.temple ? (
                        <div className="flex min-w-0 items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                          <Building2 className="w-3.5 h-3.5" />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Temple</span>
                            <span className="truncate text-sm font-medium leading-none text-slate-700">{parseLocalizedValue(product.temple.name, language)}</span>
                          </div>
                        </div>
                      ) : product.seller ? (
                        <div className="flex min-w-0 items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          <Store className="w-3.5 h-3.5" />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Seller</span>
                            <span className="truncate text-sm font-medium leading-none text-slate-700">{parseLocalizedValue(product.seller.name_en || product.seller.name || product.seller.storeName, language)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="truncate text-xs font-bold uppercase tracking-wider">Devbhakti Exclusive</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <div className="space-y-1">
                      {product.variants.slice(0, 2).map((variant: any) => (
                        <div key={variant.id} className="flex min-w-0 items-center justify-between gap-1 text-sm">
                          <span className="truncate text-slate-800">{getLocalizedName(variant)}</span>
                          <span className="font-medium text-slate-900">₹{variant.price}</span>
                        </div>
                      ))}
                      {product.variants.length > 2 && (
                        <div className="truncate text-sm text-muted-foreground">
                          +{product.variants.length - 2} more variants
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {/* Stock Column */}
                  <TableCell className="overflow-hidden">
                    {(() => {
                      const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0;
                      const isOutOfStock = totalStock === 0;
                      return isOutOfStock ? (
                        <div className="inline-flex max-w-full items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
                          <span className="truncate">Out of Stock</span>
                        </div>
                      ) : (
                        <div className="inline-flex max-w-full items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="truncate">{totalStock} In Stock</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      {hasPermission("products.approval") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8  ${product.status === 'approved' ? 'text-amber-600' : 'text-emerald-600'}`}
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          title={product.status === 'approved' ? t("admin.products.list.set_pending") : t("admin.products.list.approve_product")}
                        >
                          {product.status === 'approved' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600"
                        onClick={() => router.push(`/admin/products/${product.id}/view`)}
                        title={t("admin.products.list.view_details")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission("products.edit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => router.push(`/admin/products/edit/${product.id}?page=${currentPage}`)}
                          title={t("admin.products.list.edit_product")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission("products.delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(product.id)}
                          title={t("admin.products.list.delete_product")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/50">
          <p className="text-sm text-muted-foreground">
            {t("admin.products.list.items_pagination")
              .replace("{start}", (stats.total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0).toString())
              .replace("{end}", Math.min(currentPage * itemsPerPage, stats.total).toString())
              .replace("{total}", stats.total.toString())}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("admin.products.list.previous")}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="text-muted-foreground mx-1">...</span>}
              {totalPages > 5 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={isLoading}
                >
                  {totalPages}
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              {t("admin.products.list.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function ProductsManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading Products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
