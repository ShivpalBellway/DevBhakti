"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";
import {
  Trophy,
  Plus,
  Calendar,
  Layers,
  Heart,
  Share2,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Search,
  ChevronRight,
  Loader2,
  Trash2,
  ExternalLink,
  Crown,
  Edit,
  Download,
  AlertTriangle,
  X,
  Eye,
  Phone,
  MapPin,
  User,
  Tag,
  MessageSquare,
  Building,
  Clock,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  bannerImage?: string;
  startDate?: string;
  endDate?: string;
  maxImagesPerEntry: number;
  maxLikesPerUserPerDay: number;
  isActive: boolean;
  _count?: { entries: number };
  winner?: {
    id: string;
    prize: string;
    tagline: string;
    entry?: {
      name: string;
      city: string;
    };
  };
}

interface Submission {
  id: string;
  name: string;
  city: string;
  address: string;
  participantType: string;
  images: string[];
  caption?: string;
  likesCount: number;
  status?: string;
  createdAt: string;
  user?: { name?: string; phone?: string; email?: string };
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "submissions" | "winner">("campaigns");

  // View Submission Modal State
  const [showViewSubmissionModal, setShowViewSubmissionModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const handleViewSubmission = (sub: Submission) => {
    setViewingSubmission(sub);
    setActivePreviewImage(sub.images && sub.images.length > 0 ? sub.images[0] : null);
    setShowViewSubmissionModal(true);
  };

  // Create/Edit Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    bannerImage: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    maxImagesPerEntry: 3,
    maxLikesPerUserPerDay: 15,
    isActive: true,
  });

  // Winner Selection Modal State
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedWinnerSubmissionId, setSelectedWinnerSubmissionId] = useState("");
  const [prizeName, setPrizeName] = useState("1st Prize Gold Coin + Pooja Kit");
  const [prizeTagline, setPrizeTagline] = useState("Selected by DevBhakti Grand Jury");
  const [publishingWinner, setPublishingWinner] = useState(false);

  // Edit Submission Modal State
  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [submissionFormData, setSubmissionFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    participantType: "home",
    caption: "",
    likesCount: 0,
    images: [] as string[],
  });
  const [updatingSubmission, setUpdatingSubmission] = useState(false);

  const handleEditSubmission = (sub: Submission) => {
    setEditingSubmission(sub);
    setSubmissionFormData({
      name: sub.name || "",
      phone: sub.user?.phone || "",
      city: sub.city || "",
      address: sub.address || "",
      participantType: sub.participantType || "home",
      caption: sub.caption || "",
      likesCount: sub.likesCount || 0,
      images: Array.isArray(sub.images) ? [...sub.images] : [],
    });
    setShowEditSubmissionModal(true);
  };

  const handleSaveSubmissionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;
    setUpdatingSubmission(true);

    try {
      const res = await axios.put(`${API_URL}/admin/campaigns/submissions/${editingSubmission.id}`, submissionFormData);
      if (res.data.success) {
        showToast("Submission entry updated successfully!", "success", "Updated");
        setShowEditSubmissionModal(false);
        setEditingSubmission(null);
        if (selectedCampaign) selectCampaignHandler(selectedCampaign);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update submission.", "error", "Error");
    } finally {
      setUpdatingSubmission(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState("");

  // Search and Pagination states for Submissions
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter submissions by search term
  const filteredSubmissions = submissions.filter((sub) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = sub.name?.toLowerCase().includes(term);
    const cityMatch = sub.city?.toLowerCase().includes(term);
    const phoneMatch = sub.user?.phone?.toLowerCase().includes(term);
    const typeMatch = sub.participantType?.toLowerCase().includes(term);
    return nameMatch || cityMatch || phoneMatch || typeMatch;
  });

  // Calculate paginated submissions
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Reset to page 1 when search or campaign changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCampaign?.id]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/campaigns`);
      if (res.data.success) {
        setCampaigns(res.data.data);
        if (res.data.data.length > 0 && !selectedCampaign) {
          selectCampaignHandler(res.data.data[0]);
        } else if (res.data.data.length === 0) {
          setSelectedCampaign(null);
        } else if (selectedCampaign) {
          const updated = res.data.data.find((c: any) => c.id === selectedCampaign.id);
          if (updated) setSelectedCampaign(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching admin campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectCampaignHandler = async (c: Campaign) => {
    setSelectedCampaign(c);
    try {
      // Fetch Dashboard
      const dashRes = await axios.get(`${API_URL}/admin/campaigns/${c.id}/dashboard`);
      if (dashRes.data.success) {
        setDashboardStats(dashRes.data.data);
      }
      // Fetch Submissions
      const subRes = await axios.get(`${API_URL}/admin/campaigns/${c.id}/submissions`);
      if (subRes.data.success) {
        setSubmissions(subRes.data.data);
      }
    } catch (e) {
      console.error("Error loading campaign details:", e);
    }
  };

  // Toast & Confirm Modal states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; title?: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success", title?: string) => {
    setToast({ message, type, title });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleExportSubmissions = () => {
    if (!selectedCampaign) return;
    const exportUrl = `${API_URL}/admin/campaigns/${selectedCampaign.id}/export`;
    window.open(exportUrl, "_blank");
    showToast("Exporting submission details to Excel/CSV...", "success", "Export Started");
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.title,
        slug: formData.slug.toLowerCase().replace(/\s+/g, "-"),
        title: formData.title,
        description: formData.description,
        bannerImage: formData.bannerImage,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxImagesPerEntry: formData.maxImagesPerEntry,
        maxLikesPerUserPerDay: formData.maxLikesPerUserPerDay,
        isActive: formData.isActive,
      };

      if (isEditing && editingCampaignId) {
        const res = await axios.put(`${API_URL}/admin/campaigns/${editingCampaignId}`, payload);
        if (res.data.success) {
          showToast("Campaign updated successfully!", "success", "Updated");
          setShowCreateModal(false);
          fetchCampaigns();
        }
      } else {
        const res = await axios.post(`${API_URL}/admin/campaigns`, payload);
        if (res.data.success) {
          showToast("Campaign created successfully!", "success", "Created");
          setShowCreateModal(false);
          fetchCampaigns();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save campaign.", "error", "Error");
    }
  };

  const handleEditClick = (c: Campaign) => {
    setFormData({
      title: c.title || c.slug,
      slug: c.slug,
      description: c.description || "",
      bannerImage: c.bannerImage || "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      maxImagesPerEntry: c.maxImagesPerEntry,
      maxLikesPerUserPerDay: c.maxLikesPerUserPerDay,
      isActive: c.isActive,
    });
    setEditingCampaignId(c.id);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleDeleteCampaign = (id: string) => {
    setConfirmModal({
      title: "Delete Campaign?",
      message: "Are you sure you want to delete this campaign? This action is irreversible.",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await axios.delete(`${API_URL}/admin/campaigns/${id}`);
          if (res.data.success) {
            showToast("Campaign deleted successfully!", "success", "Deleted");
            if (selectedCampaign?.id === id) {
              setSelectedCampaign(null);
            }
            fetchCampaigns();
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || "Failed to delete campaign.", "error", "Error");
        }
      },
    });
  };

  const handleDeleteSubmission = (submissionId: string) => {
    setConfirmModal({
      title: "Delete Submission Entry?",
      message: "Are you sure you want to delete this submission entry?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await axios.delete(`${API_URL}/admin/campaigns/submissions/${submissionId}`);
          if (res.data.success) {
            showToast("Submission entry deleted successfully!", "success", "Deleted");
            if (selectedCampaign) {
              selectCampaignHandler(selectedCampaign);
            }
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || "Failed to delete submission.", "error", "Error");
        }
      },
    });
  };

  const handlePublishWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !selectedWinnerSubmissionId) return;
    setPublishingWinner(true);

    try {
      const res = await axios.post(`${API_URL}/admin/campaigns/${selectedCampaign.id}/winner`, {
        submissionId: selectedWinnerSubmissionId,
        prize: prizeName,
        tagline: prizeTagline,
      });

      if (res.data.success) {
        showToast("Winner published successfully! It is now live on the campaign page.", "success", "Winner Published 🎉");
        setShowWinnerModal(false);
        fetchCampaigns();
        if (selectedCampaign) selectCampaignHandler(selectedCampaign);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to publish winner.", "error", "Error");
    } finally {
      setPublishingWinner(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#88542B]" />
        <p className="font-bold text-sm">Loading Campaign Management Engine...</p>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-[1650px] mx-auto space-y-8">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#88542B]/10 text-[#88542B] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Festive Contest Builder
            </span>
            <span className="text-xs text-slate-400 font-medium">Dynamic Multi-Festival Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Campaigns &amp; Contests Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Maza Ganesha, Navratri, Diwali and future festive contests from one central dashboard.
          </p>
        </div>

        <button
          onClick={() => {
            setIsEditing(false);
            setEditingCampaignId("");
            setFormData({
              title: "",
              slug: "",
              description: "",
              bannerImage: "",
              startDate: new Date().toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              maxImagesPerEntry: 3,
              maxLikesPerUserPerDay: 15,
              isActive: true,
            });
            setShowCreateModal(true);
          }}
          className="bg-[#88542B] hover:bg-[#CA9E52] text-white font-bold px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Campaign
        </button>
      </div>

      {/* Top Section: Campaign Selection List (Left) & Selected Campaign Details/Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: All Configured Campaigns List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              All Configured Campaigns ({campaigns.length})
            </h2>
            {selectedCampaign && (
              <span className="text-xs font-bold text-[#88542B] bg-[#88542B]/10 px-3 py-1 rounded-full">
                Selected: {selectedCampaign.title}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
            {campaigns.map((c) => {
              const isSelected = selectedCampaign?.id === c.id;
              const isExpired = c.endDate && new Date(c.endDate) < new Date();
              const isActiveNow = c.isActive && !isExpired;

              return (
                <div
                  key={c.id}
                  onClick={() => selectCampaignHandler(c)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#88542B]/5 border-[#88542B] shadow-md ring-2 ring-[#88542B]/20"
                      : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isActiveNow
                            ? "bg-emerald-100 text-emerald-700"
                            : isExpired
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isActiveNow ? "🟢 Active Now" : isExpired ? "🔴 Expired" : "🟡 Inactive"}
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c._count?.entries || 0} entries
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 truncate mb-1">{c.title || c.slug}</h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        slug: {c.slug}
                      </span>
                      <a
                        href={`/campaigns/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-[#88542B] font-bold hover:underline flex items-center gap-0.5"
                      >
                        Live <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {c.startDate ? new Date(c.startDate).toLocaleDateString() : "No start"} -{" "}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString() : "No end"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    {c.winner ? (
                      <div className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-600" /> Winner Published!
                      </div>
                    ) : <div />}

                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditClick(c)}
                        title="Edit Campaign"
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        title="Delete Campaign"
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Campaign Header & Stats Cards (Matching Image 2) */}
        <div className="lg:col-span-8">
          {selectedCampaign ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              {/* Campaign Header & Publish Winner Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/60">
                      slug: {selectedCampaign.slug}
                    </span>
                    <a
                      href={`/campaigns/${selectedCampaign.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#88542B] font-bold hover:underline flex items-center gap-1"
                    >
                      View Live Page <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {selectedCampaign.title || selectedCampaign.slug}
                  </h2>
                </div>

                <button
                  onClick={() => setShowWinnerModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" /> Select &amp; Publish Winner
                </button>
              </div>

              {/* Stat Cards Grid (Image 2 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Entries Card */}
                <div className="bg-[#f8fafc] p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      TOTAL ENTRIES
                    </span>
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 mt-4">
                    {dashboardStats?.totalEntries ?? selectedCampaign._count?.entries ?? 0}
                  </p>
                </div>

                {/* Total Likes Card */}
                <div className="bg-[#f8fafc] p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      TOTAL LIKES
                    </span>
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 mt-4">
                    {dashboardStats?.totalLikes ?? 0}
                  </p>
                </div>

                {/* Total Shares Card */}
                <div className="bg-[#f8fafc] p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      TOTAL SHARES
                    </span>
                    <Share2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-slate-900 mt-4">
                    {dashboardStats?.totalShares ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">Select a campaign from the left to view detailed metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Campaign Submissions Section */}
      {selectedCampaign ? (
        <div className="space-y-6">
          {/* Published Winner Banner (If exists) */}
          {selectedCampaign.winner && (
            <div className="bg-gradient-to-r from-[#3d1a10] to-[#88542B] text-white rounded-3xl p-6 shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#3d1a10] flex items-center justify-center font-black shrink-0 shadow">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-300">
                    Official Contest Winner Published
                  </span>
                  <h3 className="font-bold text-base text-white">
                    {selectedCampaign.winner.entry?.name} — {selectedCampaign.winner.entry?.city}
                  </h3>
                  <p className="text-xs text-white/70">
                    Prize: <strong>{selectedCampaign.winner.prize}</strong> ({selectedCampaign.winner.tagline})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWinnerModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Change Winner
              </button>
            </div>
          )}

            {/* Submissions Management Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Submissions &amp; Engagement ({filteredSubmissions.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manual Winner selection based on Jury &amp; Engagement
                  </p>
                </div>

                {/* Search & Export Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, city, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#88542B] focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleExportSubmissions}
                    className="bg-[#88542B] hover:bg-[#6e4220] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0 w-full sm:w-auto justify-center"
                    title="Export All User Info to CSV/Excel"
                  >
                    <Download className="w-4 h-4" /> Export CSV / Excel
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-base font-semibold">
                    {searchTerm ? "No matching submissions found." : "No contest submissions yet for this campaign."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-extrabold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                          <th className="p-5">Entry / Family Name</th>
                          <th className="p-5">Phone</th>
                          <th className="p-5">Type</th>
                          <th className="p-5">City</th>
                          <th className="p-5">Images</th>
                          <th className="p-5">Likes</th>
                          <th className="p-5">Submitted On</th>
                          <th className="p-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {paginatedSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-orange-50/40 transition-colors">
                            <td className="p-5">
                              <p className="font-extrabold text-slate-900 text-base">{sub.name}</p>
                              
                            </td>
                            <td className="p-5">
                              <p className="text-xs text-slate-400 mt-0.5">{sub.user?.phone || "Guest"}</p>
                            </td>
                            <td className="p-5">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  sub.participantType === "mandal"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {sub.participantType === "mandal" ? "Mandal" : "Home"}
                              </span>
                            </td>
                            <td className="p-5 font-bold text-slate-800">{sub.city}</td>
                            <td className="p-5">
                              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleViewSubmission(sub)}>
                                {sub.images.slice(0, 3).map((img, i) => (
                                  <img
                                    key={i}
                                    src={img}
                                    alt=""
                                    className="w-20 h-20 rounded-xl object-cover border-2 border-slate-100 shadow-sm hover:scale-105 transition-transform"
                                  />
                                ))}
                                {sub.images.length > 3 && (
                                  <span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                                    +{sub.images.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-5 font-black text-slate-900 text-base">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-600 border border-red-100">
                                <Heart className="w-4 h-4 fill-current" /> {sub.likesCount}
                              </span>
                            </td>
                            <td className="p-5 text-xs text-slate-500 font-medium">
                              {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewSubmission(sub)}
                                  title="View All Submission Info"
                                  className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditSubmission(sub)}
                                  title="Edit Submission Details"
                                  className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubmission(sub.id)}
                                  title="Delete Submission Entry"
                                  className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of{" "}
                        {filteredSubmissions.length} entries
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1 px-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                                currentPage === page
                                  ? "bg-[#88542B] text-white"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}

      {/* Modal: Create/Edit Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-slate-900">
              {isEditing ? "Edit Festive Campaign" : "Create New Festive Campaign"}
            </h3>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Campaign Title
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Navratri Dandiya Contest 2025"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#88542B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  URL Slug
                </label>
                <input
                  required
                  disabled={isEditing}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. navratri-utsav"
                  className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#88542B] ${
                    isEditing ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Images / Entry
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxImagesPerEntry}
                    onChange={(e) =>
                      setFormData({ ...formData, maxImagesPerEntry: parseInt(e.target.value) || 3 })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div> */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#88542B] hover:bg-[#CA9E52] text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Winner */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Publish Official Winner</h3>
            </div>

            <form onSubmit={handlePublishWinner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Winning Submission
                </label>
                <select
                  required
                  value={selectedWinnerSubmissionId}
                  onChange={(e) => setSelectedWinnerSubmissionId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  <option value="">-- Choose Entry --</option>
                  {submissions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.city}) — ❤️ {sub.likesCount} Likes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Prize Title
                </label>
                <input
                  required
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  placeholder="e.g. 1st Prize Gold Coin + DevBhakti Kit"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jury Tagline / Caption
                </label>
                <input
                  value={prizeTagline}
                  onChange={(e) => setPrizeTagline(e.target.value)}
                  placeholder="e.g. Selected for exceptional eco-friendly Ganesha idol design"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWinnerModal(false)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishingWinner}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {publishingWinner ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Winner Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast Notification Popup */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] max-w-md bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-extrabold text-sm text-slate-900">
              {toast.title || (toast.type === "success" ? "Success" : "Error")}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal: Edit Submission Entry */}
      {showEditSubmissionModal && editingSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Submission Entry</h3>
              <button
                onClick={() => setShowEditSubmissionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmissionEdit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Participant / Family Name</label>
                  <input
                    required
                    value={submissionFormData.name}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    value={submissionFormData.phone}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">City</label>
                  <input
                    required
                    value={submissionFormData.city}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, city: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 uppercase mb-1">Participant Type</label>
                  <select
                    value={submissionFormData.participantType}
                    onChange={(e) => setSubmissionFormData({ ...submissionFormData, participantType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="home">Home</option>
                    <option value="mandal">Mandal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Address</label>
                <input
                  value={submissionFormData.address}
                  onChange={(e) => setSubmissionFormData({ ...submissionFormData, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Caption / Message</label>
                <textarea
                  rows={2}
                  value={submissionFormData.caption}
                  onChange={(e) => setSubmissionFormData({ ...submissionFormData, caption: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase mb-1">Likes Count</label>
                <input
                  type="number"
                  min="0"
                  value={submissionFormData.likesCount}
                  onChange={(e) => setSubmissionFormData({ ...submissionFormData, likesCount: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSubmissionModal(false)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSubmission}
                  className="flex-1 bg-[#88542B] hover:bg-[#CA9E52] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {updatingSubmission ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Submission Details */}
      {showViewSubmissionModal && viewingSubmission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#88542B]/20">
            {/* Modal Header - Theme Warm Gradient */}
            <div className="p-6 bg-gradient-to-r from-[#3d1a10] via-[#5c3318] to-[#88542B] text-white flex items-center justify-between border-b border-[#CA9E52]/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#CA9E52] text-[#3d1a10] flex items-center justify-center shrink-0 shadow-md">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-amber-200 border border-white/10">
                      Submission Details
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#CA9E52]/30 text-amber-300 border border-[#CA9E52]/40">
                      {viewingSubmission.participantType === "mandal" ? "Mandal Entry" : "Home Entry"}
                    </span>
                  </div>
                  <h3 className="font-black text-xl text-white mt-1 capitalize tracking-tight">{viewingSubmission.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setShowViewSubmissionModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#fdfbf7]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Side: Images Preview Gallery (col-span-5) */}
                <div className="md:col-span-5 space-y-3">
                  <div
                    onClick={() => activePreviewImage && setFullScreenImage(activePreviewImage)}
                    className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-square relative group shadow-sm cursor-pointer"
                  >
                    {activePreviewImage ? (
                      <img
                        src={activePreviewImage}
                        alt={viewingSubmission.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-amber-50/50">
                        <ImageIcon className="w-10 h-10 mb-1 text-amber-300" />
                        <span className="text-xs font-semibold text-slate-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {viewingSubmission.images && viewingSubmission.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {viewingSubmission.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePreviewImage(img)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            activePreviewImage === img
                              ? "border-[#88542B] ring-2 ring-[#88542B]/30 scale-105"
                              : "border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {viewingSubmission.images && viewingSubmission.images.length > 0 && (
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      Showing {viewingSubmission.images.length} {viewingSubmission.images.length === 1 ? "image" : "images"} uploaded
                    </p>
                  )}
                </div>

                {/* Right Side: Detailed Information Grid (col-span-7) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Engagement & Status Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50/80 border border-red-100 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Total Likes</span>
                        <span className="text-xl font-black text-slate-900">{viewingSubmission.likesCount}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Contest Type</span>
                        <span className="text-sm font-black text-slate-900 capitalize">
                          {viewingSubmission.participantType || "Home"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Cards */}
                  <div className="bg-white rounded-2xl p-4 border border-amber-950/10 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase text-[#88542B] tracking-wider border-b border-amber-100/60 pb-2">
                      Participant Details
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-3 text-xs text-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#88542B] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                          <span className="font-bold text-slate-900 text-sm">{viewingSubmission.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#88542B] flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                          <span className="font-bold text-slate-900">{viewingSubmission.user?.phone || "Not Provided"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#88542B] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">City / Location</span>
                          <span className="font-bold text-slate-900">{viewingSubmission.city}</span>
                        </div>
                      </div>

                      {viewingSubmission.address && (
                        <div className="flex items-start gap-3 pt-0.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#88542B] flex items-center justify-center shrink-0 mt-0.5">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Address</span>
                            <span className="font-medium text-slate-800">{viewingSubmission.address}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-0.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#88542B] flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date & Time</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(viewingSubmission.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caption / Description Box */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-2xl p-4 border border-orange-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#88542B]">
                      <MessageSquare className="w-4 h-4" /> Caption / Message
                    </div>
                    <p className="text-xs text-slate-800 italic leading-relaxed">
                      "{viewingSubmission.caption || "No caption provided."}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Theme Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setShowViewSubmissionModal(false);
                  setSelectedWinnerSubmissionId(viewingSubmission.id);
                  setShowWinnerModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" /> Select &amp; Publish Winner
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowViewSubmissionModal(false);
                    handleEditSubmission(viewingSubmission);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" /> Edit Details
                </button>
                <button
                  onClick={() => setShowViewSubmissionModal(false)}
                  className="bg-[#88542B] hover:bg-[#6e4220] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal: Full Screen Image Zoom */}
      {fullScreenImage && (
        <div
          onClick={() => setFullScreenImage(null)}
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[200] animate-in fade-in duration-200 cursor-zoom-out"
        >
          {/* Top Bar with Prominent Close Cross Button */}
          <div className="absolute top-5 right-5 z-10 flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImage(null);
              }}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/30 shadow-2xl backdrop-blur-md"
              title="Close Full Image (Esc)"
            >
              <X className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center p-2"
          >
            <img
              src={fullScreenImage}
              alt="Full View"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20 select-none"
            />
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
