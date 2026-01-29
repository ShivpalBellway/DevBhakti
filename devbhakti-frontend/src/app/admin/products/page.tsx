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
} from "lucide-react";
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

import {
  fetchAllProductsAdmin,
  deleteProductAdmin,
  toggleProductStatusAdmin,
} from "@/api/adminController";

export default function ProductsManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllProductsAdmin();
      setProducts(data);
    } catch (error: any) {
      console.error("Load Products Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load products";
      const errorDetails = error?.response?.data?.details;
      
      toast({
        title: "Error Loading Products",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
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
        toast({ title: "Success", description: "Product deleted successfully" });
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

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.templeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Management</h1>
          <p className="text-muted-foreground">Manage products, variants, and pricing.</p>
        </div>
        <Button onClick={() => router.push('/admin/products/create')} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, category, or temple..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Temple</TableHead>
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
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{product.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm">{product.templeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.variants.slice(0, 2).map((variant: any) => (
                        <div key={variant.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{variant.name}</span>
                          <span className="font-medium text-slate-900">₹{variant.price}</span>
                        </div>
                      ))}
                      {product.variants.length > 2 && (
                        <div className="text-xs text-muted-foreground">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8  ${product.status === 'approved' ? 'text-amber-600' : 'text-emerald-600'}`}
                        onClick={() => handleToggleStatus(product.id, product.status)}
                        title={product.status === 'approved' ? "Set to Pending" : "Approve Product"}
                      >
                        {product.status === 'approved' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  {selectedProduct.image ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${selectedProduct.image}`}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-slate-600" />
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
                  <label className="text-sm font-medium text-slate-700">Temple</label>
                  <p className="text-slate-900">{selectedProduct.temple?.name || "General Product"}</p>
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
                    <div key={variant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-900">{variant.name}</span>
                        <span className="text-sm text-slate-600 ml-2">Stock: {variant.stock}</span>
                      </div>
                      <span className="font-semibold text-slate-900">₹{variant.price}</span>
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
