"use client";

import { useEffect, useState } from "react";
import {
    UserPlus, Pencil, Trash2, ShieldCheck, Mail, Power,
    PowerOff, Search, X, Eye, EyeOff, Users, CheckCircle2,
    Calendar, Building2, UserCircle2, Lock,
} from "lucide-react";
import {
    fetchSellerStaffMembers,
    fetchSellerRoles,
    createSellerStaffMember,
    updateSellerStaffMember,
    deleteSellerStaffMember
} from "@/api/sellerController";
import { useAdminAuth } from "@/hooks/use-admin-auth";

type Permission = { key: string; label: string };
type Role = { id: string; name: string; permissions: Permission[] };
type StaffMember = {
    id: string; name: string; email: string; isActive: boolean;
    createdAt: string; staffRoles: { role: Role }[];
};

const emptyForm = { name: "", email: "", password: "", roleIds: [] as string[], isActive: true };

export default function SellerStaffMembersPage() {
    const { hasPermission } = useAdminAuth();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [showPass, setShowPass] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, rolesRes] = await Promise.all([
                fetchSellerStaffMembers(),
                fetchSellerRoles(),
            ]);

            if (staffRes.success) setStaffList(staffRes.data);
            if (rolesRes.success) setRoles(rolesRes.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreate = () => {
        setEditingStaff(null);
        setForm(emptyForm);
        setError("");
        setShowPass(false);
        setModalOpen(true);
    };

    const openEdit = (s: StaffMember) => {
        setEditingStaff(s);
        setForm({
            name: s.name, email: s.email, password: "",
            roleIds: s.staffRoles.map((sr) => sr.role.id),
            isActive: s.isActive,
        });
        setError("");
        setShowPass(false);
        setModalOpen(true);
    };

    const toggleRole = (id: string) => {
        setForm((f) => ({
            ...f,
            roleIds: f.roleIds.includes(id) ? f.roleIds.filter((r) => r !== id) : [...f.roleIds, id],
        }));
    };

    const handleSave = async () => {
        if (!form.name || !form.email) { setError("Name and email are required"); return; }
        if (!editingStaff && !form.password) { setError("Password is required"); return; }

        setSaving(true);
        setError("");

        try {
            const body: any = {
                name: form.name,
                email: form.email,
                roleIds: form.roleIds
            };
            if (form.password) body.password = form.password;
            if (editingStaff) body.isActive = form.isActive;

            const res = editingStaff
                ? await updateSellerStaffMember(editingStaff.id, body)
                : await createSellerStaffMember(body);

            if (!res.success) {
                setError(res.error || "Something went wrong");
                return;
            }

            setModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteSellerStaffMember(id);
            if (res.success) {
                setDeleteConfirm(null);
                fetchData();
            } else {
                setError(res.error || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            setError("Delete failed");
        }
    };

    const filtered = staffList.filter(
        (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-7 h-7 text-primary" /> Staff Management
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Monitor and manage your seller staff accounts and digital access
                    </p>
                </div>
                {hasPermission('team.staff.manage') && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-bold text-sm shadow-lg shadow-primary/20"
                    >
                        <UserPlus className="w-4 h-4" /> Add Staff Member
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Staff</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{staffList.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active Members</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{staffList.filter(s => s.isActive).length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Restricted</p>
                    <p className="text-3xl font-bold text-destructive mt-1">{staffList.filter(s => !s.isActive).length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Defined Roles</p>
                    <p className="text-3xl font-bold text-primary mt-1">{roles.length}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or role..."
                        className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Table or Empty State */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground font-medium">Fetching personnel data...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No personnel records found</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                        Try adjusting your search or add your first staff member to your digital seller panel.
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Officer Details</th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Roles</th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Security Status</th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Enlistment Date</th>
                                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-sm">
                                                    {s.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{s.name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="w-3.5 h-3.5" />{s.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.staffRoles.length === 0 ? (
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 italic">UNSIGNED</span>
                                                ) : s.staffRoles.map((sr) => (
                                                    <div key={sr.role.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border text-[11px] font-bold text-foreground rounded shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                        {sr.role.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full border ${s.isActive ? "bg-green-500/5 border-green-500/20 text-green-600" : "bg-destructive/5 border-destructive/20 text-destructive"}`}>
                                                {s.isActive ? <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> : <PowerOff className="w-3 h-3" />}
                                                {s.isActive ? "Active Path" : "Restricted"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(s.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {hasPermission('team.staff.manage') && (
                                                    <>
                                                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all hover:scale-110" title="Edit Access">
                                                            <Pencil className="w-4.5 h-4.5" />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all hover:scale-110" title="Revoke Access">
                                                            <Trash2 className="w-4.5 h-4.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {!hasPermission('team.staff.manage') && (
                                                    <ShieldCheck className="w-4.5 h-4.5 text-muted-foreground/30" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto pt-16">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-200 mb-10">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                            <div>
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    {editingStaff ? <Pencil className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
                                    {editingStaff ? "Update Access Privilege" : "Digital Enlistment"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">Configure staff account and security credentials</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-7 space-y-6">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Legal Name *</label>
                                        <div className="relative">
                                            <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                placeholder="Enter officer name"
                                                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                placeholder="staff@seller.com" type="email"
                                                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Secure Password {editingStaff ? "(Keep current: leave blank)" : "*"}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            type={showPass ? "text" : "password"} placeholder="Minimum 8 characters"
                                            className="w-full pl-10 pr-12 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Tactical Roles
                                        </label>
                                        {form.roleIds.length > 0 && (
                                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded tracking-tighter uppercase">{form.roleIds.length} Roles Bound</span>
                                        )}
                                    </div>
                                    {roles.length === 0 ? (
                                        <div className="p-4 bg-muted/30 border border-dashed border-border rounded-xl text-center">
                                            <p className="text-xs text-muted-foreground font-medium">
                                                No roles have been architected yet. Navigate to <span className="text-primary font-bold tracking-tight border-b border-primary/30">Roles & Permissions</span> to define access sets.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {roles.map((role) => {
                                                const selected = form.roleIds.includes(role.id);
                                                return (
                                                    <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all group ${selected ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border bg-background text-foreground hover:bg-muted/50 hover:border-primary/50"}`}>
                                                        <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? "bg-primary border-primary" : "border-muted group-hover:border-primary/50"}`}>
                                                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                                        </div>
                                                        {role.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {editingStaff && (
                                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl mt-4">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Operational Access</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Toggle to revoke system entry</p>
                                        </div>
                                        <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ring-offset-2 ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 ${form.isActive ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-muted"}`}>
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-7 border-t border-border bg-muted/20">
                            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-3 border border-border bg-background rounded-xl text-sm font-bold text-foreground hover:bg-muted/50 transition-all active:scale-95 shadow-sm">
                                DISCARD
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-[1.5] px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
                                {saving ? "PROCESSING..." : editingStaff ? "UPDATE CREDENTIALS" : "ENLIST OFFICER"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-7 shadow-2xl w-full max-w-sm text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 rounded-full bg-destructive/10 border-4 border-destructive/5 flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-9 h-9 text-destructive" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-1 tracking-tight">REVOKE ACCESS?</h3>
                        <p className="text-sm text-muted-foreground mb-7 font-medium leading-relaxed">
                            Are you sure you want to remove <span className="text-foreground font-black border-b-2 border-destructive/20">{staffList.find(s => s.id === deleteConfirm)?.name}</span> from the seller panel? All active sessions will be terminated.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 border border-border bg-background rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm">ABORT</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-3 bg-destructive text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20">CONFIRM REVOKE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
