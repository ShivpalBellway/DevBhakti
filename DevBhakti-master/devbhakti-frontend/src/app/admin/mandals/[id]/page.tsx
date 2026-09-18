"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight,
    MapPin, Phone, Mail, User, Building2, FileText,
    CheckCircle, XCircle, Clock, Image as ImageIcon,
    Video, ExternalLink, Wifi, WifiOff
} from "lucide-react";
import { fetchMandalByIdAdmin, deleteMandalAdmin, toggleMandalStatusAdmin } from "@/api/adminController";

function getName(val: any): string {
    if (!val) return "—";
    if (typeof val === "string") { try { val = JSON.parse(val); } catch { return val; } }
    return val?.en || val?.hi || "—";
}
function getAll(val: any) {
    if (!val) return null;
    if (typeof val === "string") { try { val = JSON.parse(val); } catch { return { en: val }; } }
    return val;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function MandalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [mandal, setMandal] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchMandalByIdAdmin(id);
            if (res.success) setMandal(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [id]);

    const handleDelete = async () => {
        if (!confirm("Permanently delete this mandal?")) return;
        await deleteMandalAdmin(id);
        router.push("/admin/mandals");
    };

    const handleToggleActive = async () => {
        await toggleMandalStatusAdmin(id, { isActive: !mandal.isActive });
        load();
    };

    const handleStatusChange = async (status: string) => {
        await toggleMandalStatusAdmin(id, { status });
        load();
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    );

    if (!mandal) return (
        <div className="text-center py-20 text-muted-foreground">Mandal not found.</div>
    );

    const nameData = getAll(mandal.name);
    const descData = getAll(mandal.description);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/mandals" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{getName(mandal.name)}</h1>
                        <p className="text-sm text-muted-foreground">{mandal.mandalType || "Mandal"} · ID: {mandal.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            mandal.isActive
                                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                    >
                        {mandal.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {mandal.isActive ? "Active" : "Inactive"}
                    </button>
                    <Link
                        href={`/admin/mandals/edit/${id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Edit className="w-4 h-4" /> Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image + Banner */}
                    {mandal.image && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <img
                                src={`${API_BASE}${mandal.image}`}
                                alt="Mandal"
                                className="w-full h-56 object-cover"
                            />
                        </div>
                    )}

                    {mandal.bannerImages?.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Banner Images
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {mandal.bannerImages.map((url: string, i: number) => (
                                    <img
                                        key={i}
                                        src={`${API_BASE}${url}`}
                                        alt={`Banner ${i + 1}`}
                                        className="w-28 h-20 object-cover rounded-lg border border-border"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {descData && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Description</h3>
                            <div className="space-y-4">
                                {descData.en && (
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">English</span>
                                        <div
                                            className="text-sm text-foreground mt-1 prose prose-sm max-w-none leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: descData.en }}
                                        />
                                    </div>
                                )}
                                {descData.hi && (
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hindi</span>
                                        <div
                                            className="text-sm text-foreground mt-1 prose prose-sm max-w-none leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: descData.hi }}
                                        />
                                    </div>
                                )}
                                {descData.mr && (
                                    <div>
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Marathi</span>
                                        <div
                                            className="text-sm text-foreground mt-1 prose prose-sm max-w-none leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: descData.mr }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Name i18n */}
                    {nameData && (nameData.hi || nameData.mr) && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Name (Multilingual)</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                {nameData.en && <div><span className="text-xs text-muted-foreground">English</span><p className="font-medium">{nameData.en}</p></div>}
                                {nameData.hi && <div><span className="text-xs text-muted-foreground">Hindi</span><p className="font-medium">{nameData.hi}</p></div>}
                                {nameData.mr && <div><span className="text-xs text-muted-foreground">Marathi</span><p className="font-medium">{nameData.mr}</p></div>}
                            </div>
                        </div>
                    )}

                    {/* Deity & Festivals */}
                    {(mandal.presiding_deity || mandal.festivals) && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Deity & Festivals</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {mandal.presiding_deity && (
                                    <div><span className="text-xs text-muted-foreground">Presiding Deity</span><p className="font-medium">{mandal.presiding_deity}</p></div>
                                )}
                                {mandal.festivals && (
                                    <div><span className="text-xs text-muted-foreground">Festivals</span><p className="font-medium">{mandal.festivals}</p></div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Live Darshan Section */}
                    {(mandal.liveUrl || mandal.isLive) && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Video className="w-4 h-4 text-red-600" />
                                    Live Darshan
                                </h3>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    mandal.isLive
                                        ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                        : "bg-zinc-100 text-zinc-500 border-zinc-200"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${mandal.isLive ? "bg-red-600" : "bg-zinc-400"}`} />
                                    {mandal.isLive ? "LIVE ENABLED" : "INACTIVE"}
                                </span>
                            </div>

                            {mandal.liveUrl && (
                                <>
                                    <div className="mb-3">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stream URL</span>
                                        <div className="mt-1 flex items-center gap-2">
                                            <a
                                                href={mandal.liveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline break-all flex items-center gap-1.5 font-medium"
                                            >
                                                {mandal.liveUrl}
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Video Preview */}
                                    <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200">
                                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 text-xs text-zinc-400">
                                            <span className="flex items-center gap-1.5 font-semibold">
                                                <Video className="w-3.5 h-3.5 text-red-500" />
                                                Live Preview
                                            </span>
                                            {mandal.isLive ? (
                                                <span className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                                                    <Wifi className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400 text-[10px] font-bold flex items-center gap-1">
                                                    <WifiOff className="w-3 h-3" /> Disabled
                                                </span>
                                            )}
                                        </div>
                                        <div className="aspect-video w-full">
                                            <iframe
                                                src={
                                                    mandal.liveUrl.includes("youtube.com/watch?v=")
                                                        ? mandal.liveUrl.replace("watch?v=", "embed/").split("&")[0]
                                                        : mandal.liveUrl.includes("youtu.be/")
                                                        ? mandal.liveUrl.replace("youtu.be/", "youtube.com/embed/").split("?")[0]
                                                        : mandal.liveUrl
                                                }
                                                className="w-full h-full"
                                                allowFullScreen
                                                title="Live Darshan Preview"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {!mandal.liveUrl && mandal.isLive && (
                                <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    ⚠️ Live is enabled but no stream URL is set. Add a YouTube/Embed URL in Edit.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Status Control */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Status</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border mb-3 ${STATUS_COLORS[mandal.status] || "bg-muted"}`}>
                            {mandal.status}
                        </div>
                        <div className="flex flex-col gap-2">
                            {["APPROVED", "PENDING", "REJECTED"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    disabled={mandal.status === s}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                        s === "APPROVED" ? "bg-green-50 text-green-700 hover:bg-green-100" :
                                        s === "REJECTED" ? "bg-red-50 text-red-700 hover:bg-red-100" :
                                        "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                    }`}
                                >
                                    Mark as {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Contact</h3>
                        {[
                            { icon: Phone, label: mandal.contactNumber },
                            { icon: Mail, label: mandal.email },
                            { icon: User, label: mandal.presidentName ? `President: ${mandal.presidentName}` : null },
                            { icon: FileText, label: mandal.registrationNumber ? `Reg: ${mandal.registrationNumber}` : null },
                        ].filter(i => i.label).map(({ icon: Icon, label }, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Location */}
                    {(mandal.city || mandal.state || mandal.address) && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Location</h3>
                            {mandal.address && <p className="text-xs text-muted-foreground">{mandal.address}</p>}
                            <p className="text-sm font-medium mt-1">{[mandal.city, mandal.state, mandal.pinCode].filter(Boolean).join(", ")}</p>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between"><span>Created</span><span>{new Date(mandal.createdAt).toLocaleDateString("en-IN")}</span></div>
                        <div className="flex justify-between"><span>Updated</span><span>{new Date(mandal.updatedAt).toLocaleDateString("en-IN")}</span></div>
                        {mandal.slug && <div className="flex justify-between"><span>Slug</span><span className="font-mono">{mandal.slug}</span></div>}
                    </div>

                   
                </div>
            </div>
        </div>
    );
}
