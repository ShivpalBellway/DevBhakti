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
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { useAdminAuth } from "@/hooks/use-admin-auth";


import {
  fetchAllCategoriesAdmin,
  deleteCategoryAdmin,
  toggleCategoryStatusAdmin,
} from "@/api/adminController";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();


  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCategoriesAdmin();
      setCategories(data);
    } catch (error: any) {
      console.error("Load Categories Error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load categories";
      const errorDetails = error?.response?.data?.details;

      toast({
        title: "Error Loading Categories",
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategoryAdmin(id);
        toast({ title: "Success", description: "Category deleted successfully", variant: "success" });
        loadCategories();
      } catch (error: any) {
        console.error("Delete Category Error:", error);
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete category";
        const errorDetails = error?.response?.data?.details;

        toast({
          title: "Error Deleting Category",
          description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCategoryStatusAdmin(id, !currentStatus);
      toast({
        title: "Success",
        description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      loadCategories();
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

  const getStatusBadge = (isActive: boolean) => {
    return (
      <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md border text-xs font-medium whitespace-nowrap ${isActive
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200"
        }`}>
        {isActive ? (
          <>
            <ToggleRight className="w-3 h-3" />
            <span>Active</span>
          </>
        ) : (
          <>
            <ToggleLeft className="w-3 h-3" />
            <span>Inactive</span>
          </>
        )}
      </div>
    );
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Categories</h1>
          <p className="text-muted-foreground">Manage product categories and their properties</p>
        </div>
        {hasPermission("categories.create") && (
          <Button
            onClick={() => router.push("/admin/products/categories/create")}
            className="bg-primary hover:bg-secondary/40"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories found</h3>
              <p className="text-slate-600 mb-4">Get started by creating your first product category</p>
              <Button
                onClick={() => router.push("/admin/products/categories/create")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  {/* <TableHead>Description</TableHead> */}
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead>Sort Order</TableHead> */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-300 flex items-center justify-center overflow-hidden">
                          {category.image ? (
                            <img
                              src={`${BASE_URL}${category.image}`}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{category.name}</span>
                          <span className="text-xs text-slate-800">
                            Created {new Date(category.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <p className="text-slate-900 max-w-xs truncate">
                        {category.description || "No description"}
                      </p>
                    </TableCell> */}
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {category._count.products} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(category.isActive)}
                    </TableCell>
                    {/* <TableCell>
                      <span className="text-slate-800">{category.sortOrder}</span>
                    </TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {hasPermission("categories.edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${category.isActive ? 'text-amber-600' : 'text-emerald-600'}`}
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                            title={category.isActive ? "Deactivate Category" : "Activate Category"}
                          >
                            {category.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsPreviewOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {hasPermission("categories.edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => router.push(`/admin/products/categories/edit/${category.id}`)}
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission("categories.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(category.id)}
                            title="Delete Category"
                            disabled={category._count.products > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  {selectedCategory.image ? (
                    <img
                      src={`${BASE_URL}${selectedCategory.image}`}
                      alt={selectedCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedCategory.name}</h3>
                  <div className="mt-1">{getStatusBadge(selectedCategory.isActive)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Category ID</label>
                  <p className="text-slate-900">{selectedCategory.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Sort Order</label>
                  <p className="text-slate-900">{selectedCategory.sortOrder}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Products Count</label>
                  <p className="text-slate-900">{selectedCategory._count.products}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCategory.isActive)}</div>
                </div>
              </div>
              {/* <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                <p className="text-slate-900 mt-1">
                  {selectedCategory.description || "No description provided"}
                </p>
              </div> */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Created At</label>
                  <p className="text-slate-900">
                    {new Date(selectedCategory.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Updated At</label>
                  <p className="text-slate-900">
                    {new Date(selectedCategory.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
