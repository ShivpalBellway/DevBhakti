"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  FolderPlus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  fetchMandalExpenseCategories,
  createMandalExpenseCategory,
  updateMandalExpenseCategory,
  deleteMandalExpenseCategory
} from "@/api/mandalAdminController";

export default function MandalExpenseCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCategories = async (query?: string) => {
    setLoading(true);
    try {
      const res = await fetchMandalExpenseCategories({ search: query ?? searchQuery });
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load expense categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setFormData({ name: "", description: "" });
    setErrorMsg("");
    setSuccessMsg("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setSelectedCategory(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setErrorMsg("");
    setSuccessMsg("");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (cat: any) => {
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Category name is required");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await createMandalExpenseCategory(formData);
      if (res.success) {
        setSuccessMsg("Category added successfully!");
        setTimeout(() => {
          setIsAddModalOpen(false);
          loadCategories();
        }, 800);
      } else {
        setErrorMsg(res.message || "Failed to add category");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await updateMandalExpenseCategory(selectedCategory.id, formData);
      if (res.success) {
        setSuccessMsg("Category updated successfully!");
        setTimeout(() => {
          setIsEditModalOpen(false);
          loadCategories();
        }, 800);
      } else {
        setErrorMsg(res.message || "Failed to update category");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const res = await deleteMandalExpenseCategory(selectedCategory.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        loadCategories();
      }
    } catch (err) {
      console.error("Delete category error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" /> Category Management
          </div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Expense Categories / Heads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage custom expense categories tailored specifically for your Mandal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50">
            <Link href="/mandals/dashboard/expenses">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
            </Link>
          </Button>
          <Button onClick={handleOpenAdd} className="bg-amber-700 hover:bg-amber-800 text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" /> + Add New Category
          </Button>
        </div>
      </div>

      {/* Toolbar: Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Categories Content View (Strict List View) */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">
          Loading expense categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">
          {searchQuery ? `No categories found matching "${searchQuery}".` : 'No categories defined. Click "+ Add New Category" to get started.'}
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-amber-50/50">
              <TableRow>
                <TableHead className="w-[280px] font-bold text-amber-950">Category Name</TableHead>
                <TableHead className="font-bold text-amber-950">Description</TableHead>
                {/* <TableHead className="text-center font-bold text-amber-950">Entries Logged</TableHead> */}
                {/* <TableHead className="text-right font-bold text-amber-950">Total Spent</TableHead> */}
                <TableHead className="text-right font-bold text-amber-950 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-amber-50/30">
                  <TableCell className="font-bold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                    {cat.description || "No description provided."}
                  </TableCell>
                  {/* <TableCell className="text-center font-semibold text-foreground">
                    {cat.expenseCount || 0}
                  </TableCell> */}
                  {/* <TableCell className="text-right font-bold text-rose-700">
                    ₹{(cat.totalSpent || 0).toLocaleString("en-IN")}
                  </TableCell> */}
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(cat)}
                        className="h-8 w-8 text-amber-700 hover:bg-amber-100"
                        title="Edit Category"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(cat)}
                        className="h-8 w-8 text-rose-600 hover:bg-rose-100"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5" /> Add Expense Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a new category (e.g. "Stage & Tent Setup", "Prasad Distribution").
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitCreate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Category Name *</label>
              <Input
                placeholder="e.g. Sound & Lighting"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description (Optional)</label>
              <Input
                placeholder="e.g. Speakers, generator, electrical work"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-700 hover:bg-amber-800 text-white">
                {submitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CATEGORY MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
              <Edit className="w-5 h-5" /> Edit Category
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitUpdate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Category Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-700 hover:bg-amber-800 text-white">
                {submitting ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Category
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Are you sure you want to delete <strong>"{selectedCategory?.name}"</strong>? This will remove it from active options for future expenses. Past expense entries under this category will remain intact.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {submitting ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
