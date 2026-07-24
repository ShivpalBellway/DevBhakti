"use client";

import { useEffect, useState } from "react";
import {
    ShieldCheck, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight,
    Search, Shield, Users, CheckCircle2, Lock,
} from "lucide-react";
import {
    fetchMandalRoles,
    createMandalRole,
    updateMandalRole,
    deleteMandalRole,
    fetchMandalPermissions
} from "@/api/mandalAdminController";

import { useToast } from "@/hooks/use-toast";

type Permission = { id: string; key: string; label: string };
type PermissionGroup = Record<string, Permission[]>;
type RolePermission = { permission: { key: string; label: string } };
type Role = {
    id: string;
    name: string;
    description?: string;
    rolePermissions: RolePermission[];
    _count: { staffRoles: number };
};

const emptyForm = { name: "", description: "", permissionKeys: [] as string[] };

export default function MandalRolesPage() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permRes] = await Promise.all([
                fetchMandalRoles(),
                fetchMandalPermissions(),
            ]);

            if (rolesRes.success) setRoles(rolesRes.data);
            if (permRes.success) {
                setPermissionGroups(permRes.data);
                setExpandedModules(Object.keys(permRes.data));
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch roles & permissions data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreate = () => {
        setEditingRole(null);
        setForm(emptyForm);
        setError("");
        setModalOpen(true);
    };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setForm({
            name: role.name,
            description: role.description || "",
            permissionKeys: role.rolePermissions.map((rp) => rp.permission.key),
        });
        setError("");
        setModalOpen(true);
    };

    const togglePermission = (key: string) => {
        setForm((f) => ({
            ...f,
            permissionKeys: f.permissionKeys.includes(key)
                ? f.permissionKeys.filter((k) => k !== key)
                : [...f.permissionKeys, key],
        }));
    };

    const toggleModule = (module: string) => {
        setExpandedModules((prev) =>
            prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
        );
    };

    const selectAllInModule = (module: string) => {
        const moduleKeys = permissionGroups[module].map((p) => p.key);
        const allSelected = moduleKeys.every((k) => form.permissionKeys.includes(k));
        if (allSelected) {
            setForm((f) => ({ ...f, permissionKeys: f.permissionKeys.filter((k) => !moduleKeys.includes(k)) }));
        } else {
            const combined = Array.from(new Set([...form.permissionKeys, ...moduleKeys]));
            setForm((f) => ({ ...f, permissionKeys: combined }));
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError("Role name is required"); return; }
        setSaving(true);
        setError("");

        try {
            if (editingRole) {
                const res = await updateMandalRole(editingRole.id, form);
                if (res.success) {
                    toast({
                        title: "Role Updated",
                        description: "Mandal role permissions updated successfully.",
                    });
                    setModalOpen(false);
                    fetchData();
                }
            } else {
                const res = await createMandalRole(form);
                if (res.success) {
                    toast({
                        title: "Role Created",
                        description: "New mandal role created successfully.",
                    });
                    setModalOpen(false);
                    fetchData();
                }
            }
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to save role";
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
            const res = await deleteMandalRole(id);
            if (res.success) {
                toast({
                    title: "Role Deleted",
                    description: "Mandal role deleted successfully.",
                });
                setDeleteConfirm(null);
                fetchData();
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error",
                description: err.response?.data?.error || "Failed to delete role",
                variant: "destructive",
            });
        }
    };

    const filteredRoles = roles.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPermissions = Object.values(permissionGroups).reduce((a, b) => a + b.length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Roles & Permissions
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Create custom roles and assign module-level permissions for your mandal staff.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#7b4623] hover:bg-[#5d351a] text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Role</span>
                </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-[#7b4623]" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                        <p className="text-xs text-slate-500 font-medium">Custom Roles</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">{totalPermissions}</p>
                        <p className="text-xs text-slate-500 font-medium">Available Permissions</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-900">
                            {roles.reduce((acc, r) => acc + (r._count?.staffRoles || 0), 0)}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Assigned Staff Members</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search roles by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                />
            </div>

            {/* Roles Listing */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading mandal roles...</p>
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-800">No roles found</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        Create your first custom role to delegate management duties to your staff.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRoles.map((role) => {
                        const isExpanded = expandedRole === role.id;
                        const permsCount = role.rolePermissions.length;
                        const staffCount = role._count?.staffRoles || 0;

                        return (
                            <div
                                key={role.id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:border-amber-200 transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#7b4623] shrink-0 font-bold">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">{role.name}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {staffCount} {staffCount === 1 ? "staff assigned" : "staff assigned"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(role)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                title="Edit Role"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(role.id)}
                                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                title="Delete Role"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {role.description && (
                                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                            {role.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-[#7b4623]">
                                            {permsCount} {permsCount === 1 ? "permission" : "permissions"}
                                        </span>
                                    </div>

                                    {/* Permissions Preview / Toggle */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                                            className="text-xs text-[#7b4623] font-medium flex items-center gap-1 hover:underline"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronDown className="w-3.5 h-3.5" /> Hide Permissions
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronRight className="w-3.5 h-3.5" /> View Granted Permissions
                                                </>
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 max-h-48 overflow-y-auto border border-slate-100 text-xs">
                                                {role.rolePermissions.length === 0 ? (
                                                    <p className="text-slate-400 italic">No permissions assigned.</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {role.rolePermissions.map((rp) => (
                                                            <span
                                                                key={rp.permission.key}
                                                                className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-medium"
                                                            >
                                                                {rp.permission.label || rp.permission.key}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Delete confirmation modal popup inline */}
                                {deleteConfirm === role.id && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs space-y-2">
                                        <p className="font-semibold text-red-900">Delete this role?</p>
                                        <p className="text-red-700">Staff assigned to this role will lose its permissions.</p>
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                            >
                                                Confirm Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Role Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">
                                    {editingRole ? "Edit Mandal Role" : "Create Mandal Role"}
                                </h3>
                                <p className="text-xs text-slate-500">Assign role permissions for mandal management.</p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Name & Description */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                                        Role Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mandal Event Manager, Treasurer, Volunteer Coordinator"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                                        Description (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Brief details about what this role manages..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#7b4623]"
                                    />
                                </div>
                            </div>

                            {/* Permissions Selector by Module */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">
                                        Permissions ({form.permissionKeys.length} selected)
                                    </label>
                                </div>

                                <div className="space-y-3 border rounded-xl p-3 max-h-[300px] overflow-y-auto bg-slate-50">
                                    {Object.keys(permissionGroups).length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-4 text-center">
                                            Loading permissions...
                                        </p>
                                    ) : (
                                        Object.entries(permissionGroups).map(([module, perms]) => {
                                            const moduleKeys = perms.map((p) => p.key);
                                            const allSelected = moduleKeys.every((k) => form.permissionKeys.includes(k));
                                            const isExpanded = expandedModules.includes(module);

                                            return (
                                                <div key={module} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100/70 text-xs font-semibold text-slate-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleModule(module)}
                                                            className="flex items-center gap-1.5 capitalize hover:text-[#7b4623]"
                                                        >
                                                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                            <span>Module: {module}</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllInModule(module)}
                                                            className="text-[11px] text-[#7b4623] hover:underline font-medium"
                                                        >
                                                            {allSelected ? "Deselect All" : "Select All"}
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                            {perms.map((p) => {
                                                                const checked = form.permissionKeys.includes(p.key);
                                                                return (
                                                                    <label
                                                                        key={p.key}
                                                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                                                            checked
                                                                                ? "bg-amber-50/70 border-amber-200 text-[#7b4623]"
                                                                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={checked}
                                                                            onChange={() => togglePermission(p.key)}
                                                                            className="rounded accent-[#7b4623] w-4 h-4"
                                                                        />
                                                                        <span className="font-medium truncate">{p.label || p.key}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
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
                                {saving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
