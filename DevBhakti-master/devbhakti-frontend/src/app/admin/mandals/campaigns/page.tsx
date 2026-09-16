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
  Edit,
  ExternalLink,
  Award,
  Crown,
} from "lucide-react";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  name?: string;
  description?: string;
  bannerImage?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  maxImagesPerEntry: number;
  maxLikesPerUserPerDay: number;
  _count?: { entries: number };
  winner?: any;
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
  createdAt: string;
  user?: { name?: string; phone?: string };
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "submissions" | "winner">("campaigns");

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

  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState("");

  // Fetch all campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

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
          alert("Campaign updated successfully!");
          setShowCreateModal(false);
          fetchCampaigns();
        }
      } else {
        const res = await axios.post(`${API_URL}/admin/campaigns`, payload);
        if (res.data.success) {
          alert("Campaign created successfully!");
          setShowCreateModal(false);
          fetchCampaigns();
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save campaign.");
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

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign? This action is irreversible.")) return;

    try {
      const res = await axios.delete(`${API_URL}/admin/campaigns/${id}`);
      if (res.data.success) {
        alert("Campaign deleted successfully!");
        if (selectedCampaign?.id === id) {
          setSelectedCampaign(null);
        }
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete campaign.");
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm("Are you sure you want to delete this submission entry?")) return;

    try {
      const res = await axios.delete(`${API_URL}/admin/campaigns/submissions/${submissionId}`);
      if (res.data.success) {
        alert("Submission entry deleted successfully!");
        if (selectedCampaign) {
          selectCampaignHandler(selectedCampaign);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete submission.");
    }
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
        alert("🎉 Winner published successfully! It is now live on the campaign page.");
        setShowWinnerModal(false);
        fetchCampaigns();
        if (selectedCampaign) selectCampaignHandler(selectedCampaign);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish winner.");
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
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

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column: Campaigns Selector */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            All Configured Campaigns ({campaigns.length})
          </h2>

          <div className="space-y-3">
            {campaigns.map((c) => {
              const isSelected = selectedCampaign?.id === c.id;
              const isExpired = c.endDate && new Date(c.endDate) < new Date();
              const isActiveNow = c.isActive && !isExpired;

              return (
                <div
                  key={c.id}
                  onClick={() => selectCampaignHandler(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#88542B]/5 border-[#88542B] shadow-sm"
                      : "bg-white border-slate-200 hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
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
                    <span className="text-xs font-bold text-slate-500">
                      {c._count?.entries || 0} entries
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 truncate">{c.title || c.slug}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : "No start"} -{" "}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : "No end"}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {c.winner ? (
                      <div className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-600" /> Winner Published!
                      </div>
                    ) : <div />}

                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditClick(c)}
                        title="Edit Campaign"
                        className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        title="Delete Campaign"
                        className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Campaign Dashboard & Submissions */}
        {selectedCampaign ? (
          <div className="space-y-6">
            {/* Campaign Header & Stats Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      slug: {selectedCampaign.slug}
                    </span>
                    <a
                      href={`/campaigns/${selectedCampaign.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#88542B] font-bold hover:underline flex items-center gap-1"
                    >
                      View Live Page <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedCampaign.title}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedWinnerSubmissionId(
                        selectedCampaign.winner?.entryId || (submissions[0]?.id ?? "")
                      );
                      setShowWinnerModal(true);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow transition-all shrink-0"
                  >
                    <Trophy className="w-4 h-4" />{" "}
                    {selectedCampaign.winner ? "Edit Published Winner" : "Select & Publish Winner"}
                  </button>
                </div>
              </div>

              {/* 4 Dashboard Counter Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Entries</span>
                    <Users className="w-4 h-4 text-[#88542B]" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{dashboardStats?.totalEntries || 0}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Likes</span>
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{dashboardStats?.totalLikes || 0}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Shares</span>
                    <Share2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{dashboardStats?.totalShares || 0}</p>
                </div>

               
              </div>
            </div>

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
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Submissions &amp; Engagement ({submissions.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Manual Winner selection based on Jury &amp; Engagement
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">No contest submissions yet for this campaign.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                        <th className="p-4">Entry / Family Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">City</th>
                        <th className="p-4">Images</th>
                        <th className="p-4">Likes</th>
                        <th className="p-4">Submitted On</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-orange-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{sub.name}</p>
                            <p className="text-[11px] text-slate-400">{sub.user?.phone || "Guest"}</p>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                sub.participantType === "mandal"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {sub.participantType === "mandal" ? "Mandal" : "Home"}
                            </span>
                          </td>
                          <td className="p-4 font-semibold">{sub.city}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {sub.images.slice(0, 2).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                />
                              ))}
                              {sub.images.length > 2 && (
                                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center">
                                  +{sub.images.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-black text-slate-900">
                            <span className="flex items-center gap-1 text-red-500">
                              <Heart className="w-3.5 h-3.5 fill-current" /> {sub.likesCount}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedWinnerSubmissionId(sub.id);
                                  setShowWinnerModal(true);
                                }}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all"
                              >
                                Pick as Winner
                              </button>
                              <button
                                onClick={() => handleDeleteSubmission(sub.id)}
                                title="Delete Submission Entry"
                                className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

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
    </div>
  );
}
