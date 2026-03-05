"use client";

import { useEffect, useState } from "react";
import {
    UserPlus, Pencil, Trash2, ShieldCheck, Mail, Power,
    PowerOff, Search, X, Eye, EyeOff, Users, CheckCircle2, ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
    return (
        document.cookie.split("; ").find((r) => r.startsWith("admin_token="))?.split("=")[1] ||
        localStorage.getItem("admin_token") || ""
    );
}

type Permission = { key: string; label: string };
type Role = { id: string; name: string; permissions: Permission[] };
type StaffMember = {
    id: string; name: string; email: string; isActive: boolean;
    createdAt: string; staffRoles: { role: Role }[];
};

const emptyForm = { name: "", email: "", password: "", roleIds: [] as string[], isActive: true };

export default function StaffMembersPage() {
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
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [resettingId, setResettingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const [staffRes, rolesRes] = await Promise.all([
                fetch(`${API}/admin/team/staff`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/admin/team/roles`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const staffData = await staffRes.json();
            const rolesData = await rolesRes.json();
            if (staffData.success) setStaffList(staffData.data);
            if (rolesData.success) setRoles(rolesData.data);
        } catch {
            setError("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditingStaff(null);
        setForm(emptyForm);
        setError("");
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
        setSaving(true); setError("");
        try {
            const token = getToken();
            const body: any = { name: form.name, email: form.email, roleIds: form.roleIds };
            if (form.password) body.password = form.password;
            if (editingStaff) body.isActive = form.isActive;

            const res = await fetch(
                `${API}/admin/team/staff${editingStaff ? `/${editingStaff.id}` : ""}`,
                {
                    method: editingStaff ? "PATCH" : "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Something went wrong"); return; }

            // Show success message with email notification confirmation
            toast({
                title: "Success",
                description: data.message || (editingStaff ? "Staff updated successfully" : "Staff created successfully"),
            });

            setModalOpen(false);
            fetchData();
        } catch { setError("Network error"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = getToken();
            await fetch(`${API}/admin/team/staff/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setDeleteConfirm(null);
            fetchData();
        } catch { setError("Delete failed"); }
    };

    const handleResetPassword = async (id: string) => {
        if (!form.password || form.password.length < 6) {
            setError("Please enter a new password of at least 6 characters before resetting.");
            return;
        }

        if (!confirm(`Are you sure you want to reset this staff member's password to the one you just entered? It will be emailed to them immediately.`)) {
            return;
        }

        setResettingId(id);
        setError("");

        try {
            const token = getToken();
            const res = await fetch(`${API}/admin/team/staff/${id}/reset-password`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ newPassword: form.password })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to reset password");
                return;
            }

            toast({
                title: "Password Reset",
                description: data.message || "Password reset successful. An email has been sent.",
            });

            // Clear the password field after successful reset
            setForm(f => ({ ...f, password: "" }));
        } catch {
            setError("Network error. Could not reset password.");
        } finally {
            setResettingId(null);
        }
    };

    const filtered = staffList.filter(
        (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-7 h-7 text-primary" /> Staff Members
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage your admin panel team members and their access roles
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                    <UserPlus className="w-4 h-4" /> Add Staff Member
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Staff</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{staffList.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{staffList.filter(s => s.isActive).length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Inactive</p>
                    <p className="text-3xl font-bold text-destructive mt-1">{staffList.filter(s => !s.isActive).length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No staff members yet</p>
                    <p className="text-sm">Click "Add Staff Member" to get started</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Member</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roles</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {s.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground text-sm">{s.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />{s.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {s.staffRoles.length === 0 ? (
                                                <span className="text-xs text-muted-foreground italic">No roles</span>
                                            ) : s.staffRoles.map((sr) => (
                                                <span key={sr.role.id} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                                    {sr.role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                                            {s.isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                                            {s.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {new Date(s.createdAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Name *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter full name"
                                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Email Address *</label>
                                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="Enter email address" type="email"
                                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                        Password {editingStaff ? "(leave blank unless changing)" : "*"}
                                    </label>
                                    <div className="relative">
                                        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            type={showPass ? "text" : "password"} placeholder="Enter password"
                                            className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {editingStaff && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            If you wish to force a password reset, type the new password here and click "Reset Password" below.
                                        </p>
                                    )}
                                </div>

                                {/* Role selection */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Assign Roles
                                    </label>
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
                                            No roles created yet. Create roles first from "Roles & Permissions" page.
                                        </p>
                                    ) : (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 flex justify-between items-center"
                                            >
                                                <span className="truncate">
                                                    {form.roleIds.length === 0 ? (
                                                        <span className="text-muted-foreground">Select role(s)</span>
                                                    ) : (
                                                        roles.filter(r => form.roleIds.includes(r.id)).map(r => r.name).join(", ")
                                                    )}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            {roleDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setRoleDropdownOpen(false)}
                                                    />
                                                    <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                                                        {roles.map((role) => {
                                                            const selected = form.roleIds.includes(role.id);
                                                            return (
                                                                <div
                                                                    key={role.id}
                                                                    onClick={() => toggleRole(role.id)}
                                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm transition-colors"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        readOnly
                                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 pointer-events-none"
                                                                    />
                                                                    <span className={selected ? "font-medium text-foreground" : "text-foreground"}>
                                                                        {role.name}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Status toggle (only for edit) */}
                                {editingStaff && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Account Status</p>
                                                <p className="text-xs text-muted-foreground">Disable to block login access</p>
                                            </div>
                                            <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-muted"}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-red-600 dark:text-red-400">Force Password Reset</p>
                                                <p className="text-xs text-red-600/80 dark:text-red-400/80">Type a new password in the field above, then click this button to reset their password and email them the new credentials immediately.</p>
                                            </div>
                                            <div className="flex justify-end mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleResetPassword(editingStaff.id)}
                                                    disabled={resettingId === editingStaff.id}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {resettingId === editingStaff.id ? "Resetting..." : "Reset Password Now"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-6 border-t border-border">
                            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {saving ? "Saving..." : editingStaff ? "Save Changes" : "Create Staff Member"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Delete Staff Member?</h3>
                        <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. The staff member will lose all access immediately.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
