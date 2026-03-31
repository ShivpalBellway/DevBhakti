"use client";

import React, { useState, useEffect } from "react";
import {
    HelpCircle,
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    fetchAllFAQsAdmin,
    createFAQAdmin,
    updateFAQAdmin,
    deleteFAQAdmin,
} from "@/api/adminController";
import { toast } from "@/hooks/use-toast";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

interface FAQFormState {
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
}

export default function AdminFAQsPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState<FAQFormState>({
        question: "",
        answer: "",
        order: 0,
        isActive: true,
    });

    const loadFAQs = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllFAQsAdmin();
            setFaqs(data || []);
        } catch (err) {
            toast({ title: "Failed to load FAQs", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFAQs();
    }, []);

    const openCreate = () => {
        setEditingFaq(null);
        setForm({ question: "", answer: "", order: faqs.length + 1, isActive: true });
        setShowModal(true);
    };

    const openEdit = (faq: FAQ) => {
        setEditingFaq(faq);
        setForm({
            question: faq.question,
            answer: faq.answer,
            order: faq.order,
            isActive: faq.isActive,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFaq(null);
    };

    const handleSave = async () => {
        if (!form.question.trim() || !form.answer.trim()) {
            toast({ title: "Question and answer are required", variant: "destructive" });
            return;
        }
        try {
            setSaving(true);
            if (editingFaq) {
                await updateFAQAdmin(editingFaq.id, form);
                toast({ title: "FAQ updated successfully ✅" });
            } else {
                await createFAQAdmin(form);
                toast({ title: "FAQ created successfully ✅" });
            }
            await loadFAQs();
            closeModal();
        } catch (err) {
            toast({ title: "Failed to save FAQ", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (faq: FAQ) => {
        try {
            await updateFAQAdmin(faq.id, { isActive: !faq.isActive });
            toast({ title: `FAQ ${!faq.isActive ? "activated" : "deactivated"}` });
            await loadFAQs();
        } catch (err) {
            toast({ title: "Failed to update status", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            setDeleting(true);
            await deleteFAQAdmin(deleteConfirmId);
            toast({ title: "FAQ deleted successfully" });
            setDeleteConfirmId(null);
            await loadFAQs();
        } catch (err) {
            toast({ title: "Failed to delete FAQ", variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3d1f0d] flex items-center gap-2">
                        <HelpCircle className="w-7 h-7 text-primary" />
                        Standard Pooja FAQs
                    </h1>
                    <p className="text-sm text-[#8b6b4a] mt-1">
                        These FAQs are shown on <strong>all pooja pages</strong>. Active FAQs appear first, followed by pooja-specific FAQs.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-xl px-5 py-2.5"
                >
                    <Plus className="w-4 h-4" />
                    Add FAQ
                </Button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total FAQs", value: faqs.length, color: "bg-amber-50 border-amber-200" },
                    { label: "Active", value: faqs.filter(f => f.isActive).length, color: "bg-green-50 border-green-200" },
                    { label: "Inactive", value: faqs.filter(f => !f.isActive).length, color: "bg-red-50 border-red-200" },
                ].map(stat => (
                    <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                        <div className="text-2xl font-bold text-[#3d1f0d]">{stat.value}</div>
                        <div className="text-sm text-[#8b6b4a]">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* FAQ List */}
            <div className="bg-white rounded-2xl border border-[#f0dcc8] shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="text-center py-16 text-[#8b6b4a]">
                        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">No FAQs yet.</p>
                        <p className="text-sm mt-1">Click "Add FAQ" to create the first one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0dcc8]">
                        {faqs.map((faq, idx) => (
                            <div
                                key={faq.id}
                                className={`flex items-start gap-4 px-6 py-5 transition-colors ${!faq.isActive ? "opacity-50 bg-gray-50" : "hover:bg-[#fffaf5]"}`}
                            >
                                {/* Order */}
                                <div className="flex items-center gap-2 mt-0.5 shrink-0">
                                    <GripVertical className="w-4 h-4 text-[#c9a97a] cursor-grab" />
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                        {faq.order}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-[#2d1507] text-base leading-snug">{faq.question}</span>
                                        <Badge
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${faq.isActive
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-gray-100 text-gray-500 border border-gray-200"
                                                }`}
                                        >
                                            {faq.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-[#6b5040] mt-1.5 leading-relaxed">{faq.answer}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                    <button
                                        onClick={() => handleToggleActive(faq)}
                                        title={faq.isActive ? "Deactivate" : "Activate"}
                                        className="p-2 rounded-lg hover:bg-[#f0dcc8] transition-colors"
                                    >
                                        {faq.isActive
                                            ? <EyeOff className="w-4 h-4 text-[#8b6b4a]" />
                                            : <Eye className="w-4 h-4 text-green-600" />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(faq)}
                                        title="Edit"
                                        className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4 text-amber-600" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(faq.id)}
                                        title="Delete"
                                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#f0dcc8]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-[#f0dcc8] flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#3d1f0d] flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" />
                                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                            </h2>
                            <button onClick={closeModal} className="text-[#8b6b4a] hover:text-[#3d1f0d] transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#3d1f0d] mb-1.5">
                                    Question <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.question}
                                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                                    placeholder="e.g. What does this pooja include?"
                                    className="w-full border border-[#e8cdb0] rounded-xl px-4 py-2.5 text-[#2d1507] placeholder:text-[#c9a97a] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#3d1f0d] mb-1.5">
                                    Answer <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={form.answer}
                                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                    placeholder="Provide a clear and helpful answer..."
                                    className="w-full border border-[#e8cdb0] rounded-xl px-4 py-2.5 text-[#2d1507] placeholder:text-[#c9a97a] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#3d1f0d] mb-1.5">Display Order</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        min={0}
                                        onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-[#e8cdb0] rounded-xl px-4 py-2.5 text-[#2d1507] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#3d1f0d] mb-1.5">Status</label>
                                    <button
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.isActive
                                            ? "bg-green-50 border-green-200 text-green-700"
                                            : "bg-gray-50 border-gray-200 text-gray-500"
                                            }`}
                                    >
                                        {form.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {form.isActive ? "Active" : "Inactive"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-[#f0dcc8] flex items-center justify-end gap-3">
                            <Button variant="outline" onClick={closeModal} className="rounded-xl border-[#e8cdb0]">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {editingFaq ? "Update FAQ" : "Create FAQ"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-100 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-[#3d1f0d]">Delete FAQ?</h3>
                        </div>
                        <p className="text-sm text-[#6b5040] mb-6">
                            This FAQ will be permanently removed from all pooja pages. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
