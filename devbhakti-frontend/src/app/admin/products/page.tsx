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
} from "lucide-react";
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

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchAllProductsAdmin,
  deleteProductAdmin,
  toggleProductStatusAdmin,
  fetchProductOwnersAdmin,
} from "@/api/adminController";

function ProductsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const qParam = searchParams.get("q");

  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [owners, setOwners] = useState<any[]>([]);
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();


  useEffect(() => {
    loadProducts();
  }, [currentPage, selectedOwner, date]);

  useEffect(() => {
    if (qParam) setSearchTerm(qParam);
    else if (idParam) setSearchTerm(idParam);
  }, [idParam, qParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadProducts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadOwners();
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

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllProductsAdmin({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        productId: idParam || undefined,
        templeId: selectedOwner === "all" ? undefined : selectedOwner,
        date: date ? date.toISOString() : undefined
      });

      if (res.success) {
        setProducts(res.data.products);
        setStats(res.data.stats || { total: 0, pending: 0, approved: 0 });
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error: any) {
      console.error("Load Products Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load products";
      toast({
        title: "Error Loading Products",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProductAdmin(id);
        toast({ title: "Success", description: "Product deleted successfully", variant: "success" });
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
        title: "Success",
        description: `Product ${newStatus === "approved" ? "Approved" : "Set to Pending"} successfully`
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
            <span>Approved</span>
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-xs font-medium whitespace-nowrap">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs font-medium whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </div>
        );
    }
  };

  const truncateWords = (text: string, maxWords: number) => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Management</h1>
          <p className="text-slate-600">Manage products, variants, and pricing.</p>
        </div>
        {hasPermission("products.create") && (
          <Button onClick={() => router.push('/admin/products/create')} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Products</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Products</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.pending}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Approved Products</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.approved}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, category, or temple..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-full md:w-[200px]">
            <Select value={selectedOwner} onValueChange={setSelectedOwner}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
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
                  {date ? format(date, "PPP") : <span>Filter by date</span>}
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
            {(date || selectedOwner !== "all" || searchTerm) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDate(undefined);
                  setSelectedOwner("all");
                  setSearchTerm("");
                }}
                className="h-10 w-10 text-muted-foreground"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Owner/Vendor</TableHead>
              <TableHead>Variants & Pricing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-16 aspect-[5/4] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={`${BASE_URL}${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">{product.name}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {truncateWords(product.description, 10)}
                          {product.description?.split(/\s+/).length > 10 && (
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsPreviewOpen(true);
                              }}
                              className="ml-1 text-primary hover:underline font-medium"
                            >
                              more
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {product.categoryObj?.name || (product.category === "general" ? "General Products" : `Category: ${product.category?.slice(0, 8)}...`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {product.temple ? (
                        <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                          <Building2 className="w-3.5 h-3.5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Temple</span>
                            <span className="text-sm font-medium leading-none text-slate-700">{product.temple.name}</span>
                          </div>
                        </div>
                      ) : product.seller ? (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          <Store className="w-3.5 h-3.5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase leading-none mb-0.5">Seller</span>
                            <span className="text-sm font-medium leading-none text-slate-700">{product.seller.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Devbhakti Exclusive</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.variants.slice(0, 2).map((variant: any) => (
                        <div key={variant.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-800">{variant.name}</span>
                          <span className="font-medium text-slate-900">₹{variant.price}</span>
                        </div>
                      ))}
                      {product.variants.length > 2 && (
                        <div className="text-sm text-muted-foreground">
                          +{product.variants.length - 2} more variants
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {hasPermission("products.approval") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8  ${product.status === 'approved' ? 'text-amber-600' : 'text-emerald-600'}`}
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          title={product.status === 'approved' ? "Set to Pending" : "Approve Product"}
                        >
                          {product.status === 'approved' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsPreviewOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {hasPermission("products.edit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                          title="Edit Product"
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
                          title="Delete Product"
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
            Showing <span className="font-medium">{stats.total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, stats.total)}
            </span>{" "}
            of <span className="font-medium">{stats.total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show up to 5 pages for simplicity, or implement more complex pagination logic
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
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 aspect-[5/4] rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedProduct.image ? (
                    <img
                      src={`${BASE_URL}${selectedProduct.image}`}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedProduct.name}</h3>
                  <Badge variant="outline" className="w-fit mt-1">
                    {selectedProduct.category}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Product ID</label>
                  <p className="text-slate-900">{selectedProduct.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <p className="text-slate-900">{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Owner/Vendor</label>
                  <p className="text-slate-900">
                    {selectedProduct.temple
                      ? `Temple: ${selectedProduct.temple.name}`
                      : selectedProduct.seller
                        ? `Seller: ${selectedProduct.seller.name}`
                        : "DevBhakti Exclusive (Admin)"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                <p className="text-slate-900 mt-1">{selectedProduct.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Variants & Pricing</label>
                <div className="space-y-2">
                  {selectedProduct.variants.map((variant: any) => (
                    <div key={variant.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-12 h-12 rounded border bg-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {variant.image ? (
                          <img
                            src={`${BASE_URL}${variant.image}`}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900">{variant.name}</p>
                            <p className="text-xs text-slate-500">Stock: {variant.stock}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">₹{variant.price}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
