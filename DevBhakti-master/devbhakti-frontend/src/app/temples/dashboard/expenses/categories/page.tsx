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
  FolderPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  fetchTempleExpenseCategories,
  createTempleExpenseCategory,
  updateTempleExpenseCategory,
  deleteTempleExpenseCategory
} from "@/api/templeAdminController";

export default function TempleExpenseCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetchTempleExpenseCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load temple expense categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

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
      const res = await createTempleExpenseCategory(formData);
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
      const res = await updateTempleExpenseCategory(selectedCategory.id, formData);
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
      const res = await deleteTempleExpenseCategory(selectedCategory.id);
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
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" /> Category Management
          </div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Expense Categories / Heads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage custom expense categories tailored specifically for your Temple.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50">
            <Link href="/temples/dashboard/expenses">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Overview
            </Link>
          </Button>
          <Button onClick={handleOpenAdd} className="bg-amber-800 hover:bg-amber-900 text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" /> + Add New Category
          </Button>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
            Loading expense categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
            No categories defined. Click "+ Add New Category" to get started.
          </div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="border-amber-200/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <Tag className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">{cat.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-8 w-8 text-amber-800 hover:bg-amber-100"
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
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground min-h-[36px]">
                  {cat.description || "No description provided."}
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="font-bold text-rose-700">₹{(cat.totalSpent || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Entries logged:</span>
                  <span className="font-semibold text-foreground">{cat.expenseCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ADD CATEGORY MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5" /> Add Expense Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a new category (e.g. "Pooja Samagri", "Bhandara & Annadaan").
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
                placeholder="e.g. Electricity & Utilities"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Description (Optional)</label>
              <Input
                placeholder="e.g. Monthly electricity bill & generator fuel"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-800 hover:bg-amber-900 text-white">
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
              <Button type="submit" disabled={submitting} className="bg-amber-800 hover:bg-amber-900 text-white">
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
              <Trash2 className="w-5 h-5" /> Deactivate Category
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Deactivating <strong>"{selectedCategory?.name}"</strong> will remove it from active options for future expenses. Past expense entries under this category will remain intact.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white">
              {submitting ? "Deactivating..." : "Deactivate Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
