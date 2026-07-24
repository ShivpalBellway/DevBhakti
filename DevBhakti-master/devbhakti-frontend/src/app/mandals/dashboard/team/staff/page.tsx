"use client";

import { useEffect, useState } from "react";
import {
    UserPlus, Pencil, Trash2, ShieldCheck, Mail, Power,
    Search, X, Eye, EyeOff, Users, CheckCircle2, KeyRound
} from "lucide-react";
import {
    fetchMandalStaff,
    fetchMandalRoles,
    createMandalStaff,
    updateMandalStaff,
    deleteMandalStaff,
    resetMandalStaffPassword
} from "@/api/mandalAdminController";

import { useToast } from "@/hooks/use-toast";

type Permission = { key: string; label: string };
type Role = { id: string; name: string; permissions: Permission[] };
type StaffMember = {
    id: string;
    displayId?: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    staffRoles: { role: Role }[];
};

const emptyForm = { name: "", email: "", password: "", roleIds: [] as string[], isActive: true };

export default function MandalStaffMembersPage() {
    const { toast } = useToast();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [resetPassModalOpen, setResetPassModalOpen] = useState<string | null>(null);
    const [newPasswordInput, setNewPasswordInput] = useState("");
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
                fetchMandalStaff(),
                fetchMandalRoles(),
            ]);

            if (staffRes.success) setStaffList(staffRes.data);
            if (rolesRes.success) setRoles(rolesRes.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch staff data");
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
            name: s.name,
            email: s.email,
            password: "",
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
            if (editingStaff) {
                const res = await updateMandalStaff(editingStaff.id, form);
                if (res.success) {
                    toast({
                        title: "Staff Updated",
                        description: res.message || "Staff member details updated successfully.",
                    });
                    setModalOpen(false);
                    fetchData();
                }
            } else {
                const res = await createMandalStaff(form);
                if (res.success) {
                    toast({
                        title: "Staff Created",
                        description: res.message || "New staff member added successfully.",
                    });
                    setModalOpen(false);
                    fetchData();
                }
            }
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to save staff member";
            setError(errMsg);
            toast({
                title: "Error",
                description: errMsg,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteMandalStaff(id);
            if (res.success) {
                toast({
                    title: "Staff Deleted",
                    description: "Staff member account has been deleted.",
                });
                setDeleteConfirm(null);
                fetchData();
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error",
                description: err.response?.data?.error || "Failed to delete staff member",
                variant: "destructive",
            });
        }
    };

    const handleResetPassword = async (id: string) => {
        if (!newPasswordInput || newPasswordInput.length < 6) {
            toast({
                title: "Validation Error",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await resetMandalStaffPassword(id, { newPassword: newPasswordInput });
            if (res.success) {
                toast({
                    title: "Password Reset Successful",
                    description: res.message || "Password reset successfully!",
                });
                setResetPassModalOpen(null);
                setNewPasswordInput("");
            }
        } catch (err: any) {
            toast({
                title: "Reset Failed",
                description: err.response?.data?.error || "Failed to reset password",
                variant: "destructive",
            });
        }
    };

    const filteredStaff = staffList.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.displayId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Staff & Team Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Add staff members, assign mandal roles, and control access permissions.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#7b4623] hover:bg-[#5d351a] text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm self-start sm:self-auto"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Staff Member</span>
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-[#7b4623]" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{staffList.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Total Staff Members</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">
                            {staffList.filter((s) => s.isActive).length}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Available Mandal Roles</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search staff by name, email, or Staff ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                />
            </div>

            {/* Staff Members Table */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Staff Member</span>
                    <span>Email Address</span>
                    <span>Assigned Roles</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">Loading staff members...</p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Users className="w-12 h-12 opacity-20 mx-auto mb-3 text-[#7b4623]" />
                        <p className="font-semibold text-slate-700">No staff members found</p>
                        <p className="text-xs text-slate-500 mt-1">Add your team members to manage mandal activities.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredStaff.map((s) => (
                            <div
                                key={s.id}
                                className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-slate-50/70 items-center transition-colors"
                            >
                                {/* Name & Display ID */}
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-full bg-[#7b4623]/10 text-[#7b4623] font-bold text-sm flex items-center justify-center shrink-0">
                                        {s.name ? s.name.substring(0, 2).toUpperCase() : "ST"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                                        <p className="text-xs text-slate-500">ID: {s.displayId || s.id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="w-full text-xs text-slate-600 flex items-center gap-1.5 truncate">
                                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{s.email}</span>
                                </div>

                                {/* Assigned Roles */}
                                <div className="w-full flex flex-wrap gap-1">
                                    {s.staffRoles?.length > 0 ? (
                                        s.staffRoles.map((sr) => (
                                            <span
                                                key={sr.role.id}
                                                className="text-[11px] font-semibold bg-amber-50 text-[#7b4623] px-2 py-0.5 rounded-md border border-amber-100"
                                            >
                                                {sr.role.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No role assigned</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="w-full">
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                            s.isActive
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-slate-100 text-slate-600 border border-slate-200"
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                        {s.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-1 w-full md:w-auto">
                                    <button
                                        onClick={() => setResetPassModalOpen(s.id)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                        title="Reset Password"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(s)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                        title="Edit Staff"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(s.id)}
                                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete Staff"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {resetPassModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResetPassModalOpen(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Reset Staff Password</h3>
                            <button onClick={() => setResetPassModalOpen(null)} className="p-1 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                New Password (min 6 characters)
                            </label>
                            <input
                                type="text"
                                placeholder="Enter new password..."
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setResetPassModalOpen(null)}
                                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleResetPassword(resetPassModalOpen)}
                                className="px-4 py-2 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl text-xs font-semibold"
                            >
                                Reset & Email Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Staff Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">
                                    {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Assign account credentials and roles for mandal portal access.
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rahul Sharma"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    placeholder="staff@devbhakti.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                                    {editingStaff ? "New Password (Leave blank to keep existing)" : "Password *"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Role Multi-Select */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                                    Assign Mandal Roles
                                </label>
                                {roles.length === 0 ? (
                                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                        No roles found. Please create a role first in Roles & Permissions section.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3 bg-slate-50">
                                        {roles.map((r) => {
                                            const checked = form.roleIds.includes(r.id);
                                            return (
                                                <label
                                                    key={r.id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                                                        checked
                                                            ? "bg-amber-50 border-amber-200 text-[#7b4623] font-semibold"
                                                            : "bg-white border-slate-100 text-slate-700"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleRole(r.id)}
                                                        className="rounded accent-[#7b4623] w-4 h-4"
                                                    />
                                                    <span>{r.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Active Toggle */}
                            {editingStaff && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">Account Status</p>
                                        <p className="text-[11px] text-slate-500">Enable or disable access for this staff member.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-5 h-5 accent-[#7b4623] rounded"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editingStaff ? "Update Staff" : "Add Staff"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
