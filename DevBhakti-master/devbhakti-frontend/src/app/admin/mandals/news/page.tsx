"use client";

import React, { useState, useEffect } from "react";
import {
  Newspaper,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { stripHtml } from "@/utils/textUtils";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  image?: string;
  category?: string;
  festival?: string;
  mandalId?: string;
  mandalName?: string;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminMandalNewsPage() {
  const { toast } = useToast();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [viewingItem, setViewingItem] = useState<NewsItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    festival: "Ganesh Utsav 2026",
    mandalId: "",
    mandalName: "",
    isActive: true,
  });

  useEffect(() => {
    fetchNews();
    fetchMandals();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/mandal-news/admin`);
      const data = await res.json();
      if (data.success) {
        setNewsList(data.data || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load news",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading news:", error);
    }
    setLoading(false);
  };

  const fetchMandals = async () => {
    try {
      const res = await fetch(`${API_URL}/mandals?all=true`);
      const data = await res.json();
      if (data.success) {
        setMandals(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mandals:", error);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      image: "",
      festival: "Ganesh Utsav 2026",
      mandalId: "",
      mandalName: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      image: item.image || "",
      festival: item.festival || "Ganesh Utsav 2026",
      mandalId: item.mandalId || "",
      mandalName: item.mandalName || "",
      isActive: item.isActive !== false,
    });
    setModalOpen(true);
  };

  const openViewModal = (item: NewsItem) => {
    setViewingItem(item);
    setViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a news title",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem
        ? `${API_URL}/admin/mandal-news/admin/${editingItem.id}`
        : `${API_URL}/admin/mandal-news/admin`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: editingItem ? "News Updated" : "News Published! 📰",
          description: data.message,
        });
        setModalOpen(false);
        fetchNews();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save news",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving news:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/mandal-news/admin/${id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Status Updated",
          description: data.message,
        });
        fetchNews();
      }
    } catch (error) {
      console.error("Error toggling news status:", error);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_URL}/admin/mandal-news/admin/${itemToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "News Deleted",
          description: "Mandal news item removed successfully.",
        });
        fetchNews();
      }
    } catch (error) {
      console.error("Error deleting news:", error);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Filtered List
  const filteredNews = newsList.filter((item) => {
    const description = stripHtml(item.description || "");
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mandalName || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesSearch && item.isActive;
    if (statusFilter === "INACTIVE") return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
            Mandal News
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, publish, and manage updates, announcements, and news for Mandals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <Button
            onClick={openAddModal}
            className="bg-[#7b4623] hover:bg-[#5d351a] text-white flex-1 md:flex-initial"
          >
            <Plus className="w-4 h-4 mr-2" />
            New News
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")}
        >
          <SelectTrigger className="flex h-10 w-full md:w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]">
              All Status
            </SelectItem>
            <SelectItem value="ACTIVE" className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]">
              Active
            </SelectItem>
            <SelectItem value="INACTIVE" className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* News Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>News Title</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead>Mandal</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading news...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredNews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Newspaper className="w-10 h-10 opacity-30" />
                    <p>No mandal news found. Create one now!</p>
                    <Button
                      size="sm"
                      onClick={openAddModal}
                      className="bg-[#7b4623] hover:bg-[#5d351a] text-white mt-1"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add First News
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredNews.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#7b4623]/10 flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-[#7b4623]" />
                      </div>
                      <span className="font-semibold text-slate-900 line-clamp-1">
                        {item.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="w-fit bg-indigo-50 text-indigo-700 border-indigo-100"
                    >
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[220px]">
                      <Building2 className="w-4 h-4 text-[#7b4623] shrink-0" />
                      <span className="truncate">{item.mandalName || "None"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground line-clamp-1 max-w-[420px]">
                      {stripHtml(item.description || "") || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => handleToggleActive(item.id)}
                      />
                      <Badge
                        variant={item.isActive ? "default" : "secondary"}
                        className={item.isActive ? "bg-emerald-100 text-emerald-800" : ""}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewModal(item)}
                        className="hover:bg-amber-50 hover:text-[#7b4623]"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-[#7b4623]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                        title="Edit News"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setItemToDelete(item.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                        title="Delete News"
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

      {/* CREATE / EDIT NEWS MODAL DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-amber-600" />
              {editingItem ? "Edit Mandal News" : "Add New Mandal News"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to publish or update an announcement or news story.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                News Title <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Lalbaugcha Raja First Look Revealed for Ganeshotsav 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Festival & Mandal Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Festival / Tag
                </Label>
                <Input
                  placeholder="e.g. Ganesh Utsav 2026"
                  value={formData.festival}
                  onChange={(e) => setFormData({ ...formData, festival: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Associated Mandal (Optional)
                </Label>
                <select
                  value={formData.mandalId}
                  onChange={(e) => {
                    const selected = mandals.find((m) => m.id === e.target.value);
                    setFormData({
                      ...formData,
                      mandalId: e.target.value,
                      mandalName: selected ? (typeof selected.name === "string" ? selected.name : selected.name?.en || "") : "",
                    });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Mandal (Optional) --</option>
                  {mandals.map((m) => {
                    const mName = typeof m.name === "string" ? m.name : m.name?.en || m.id;
                    return (
                      <option key={m.id} value={m.id}>
                        {mName} ({m.city || "Mumbai"})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Short Description & Full Details <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                placeholder="Write news content, schedule details, or press release announcements here..."
                value={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                minHeight="180px"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <div>
                <Label className="font-bold text-sm text-zinc-900 cursor-pointer">
                  Publish Immediately (Active)
                </Label>
                <p className="text-xs text-zinc-500">
                  Active news will be displayed on the public website and news feed.
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
              >
                {submitting ? "Saving..." : editingItem ? "Update News" : "Publish News"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW NEWS DETAILS MODAL */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Mandal News Preview
            </DialogTitle>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-4 py-2">
              <h2 className="text-2xl font-bold text-zinc-900">{viewingItem.title}</h2>

              <div
                className="prose prose-sm max-w-none text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-200"
                dangerouslySetInnerHTML={{ __html: viewingItem.description || "" }}
              />

              <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 flex justify-between">
                <span>Published At: {new Date(viewingItem.publishedAt || viewingItem.createdAt).toLocaleString("en-IN")}</span>
                <span>ID: {viewingItem.id}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Mandal News?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Mandal News item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
