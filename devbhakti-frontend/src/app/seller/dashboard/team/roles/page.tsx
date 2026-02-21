"use client";

import { useEffect, useState } from "react";
import {
    ShieldCheck, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight,
    Search, Shield, Users, CheckCircle2, Lock,
} from "lucide-react";
import { fetchSellerRoles, createSellerRole, updateSellerRole, deleteSellerRole, fetchSellerPermissions } from "@/api/sellerController";
import { useAdminAuth } from "@/hooks/use-admin-auth";

type Permission = { id: string; key: string; label: string };
type PermissionGroup = Record<string, Permission[]>;
type RolePermission = { permission: { key: string; label: string } };
type Role = {
    id: string; name: string; description?: string;
    rolePermissions: RolePermission[];
    _count: { staffRoles: number };
};

const emptyForm = { name: "", description: "", permissionKeys: [] as string[] };

export default function SellerRolesPage() {
    const { hasPermission } = useAdminAuth();
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
                fetchSellerRoles(),
                fetchSellerPermissions(),
            ]);

            if (rolesRes.success) setRoles(rolesRes.data);
            if (permRes.success) {
                setPermissionGroups(permRes.data);
                setExpandedModules(Object.keys(permRes.data));
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch roles data");
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
            setForm((f) => ({ ...f, permissionKeys: [...new Set([...f.permissionKeys, ...moduleKeys])] }));
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setError("Role name is required"); return; }
        setSaving(true); setError("");
        try {
            const res = editingRole
                ? await updateSellerRole(editingRole.id, form)
                : await createSellerRole(form);

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
            const res = await deleteSellerRole(id);
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

    const allPermCount = Object.values(permissionGroups).flat().length;
    const filtered = roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-primary" /> Roles & Permissions
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Define roles and assign specific permissions for your seller staff
                    </p>
                </div>
                {hasPermission('team.roles.manage') && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" /> Create Role
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Roles</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{roles.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Permissions</p>
                    <p className="text-3xl font-bold text-primary mt-1">{allPermCount}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Modules</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{Object.keys(permissionGroups).length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            {/* Roles List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-xl">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium text-foreground">No roles defined</p>
                    <p className="text-sm">Click "Create Role" to define your first access level</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((role) => {
                        const isExpanded = expandedRole === role.id;
                        const permCount = role.rolePermissions.length;
                        const staffCount = role._count.staffRoles;

                        const permsByModule: Record<string, string[]> = {};
                        role.rolePermissions.forEach((rp) => {
                            const mod = rp.permission.key.split(".")[0];
                            if (!permsByModule[mod]) permsByModule[mod] = [];
                            permsByModule[mod].push(rp.permission.label);
                        });

                        return (
                            <div key={role.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-foreground">{role.name}</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">{permCount} permissions</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full flex items-center gap-1 font-bold">
                                                    <Users className="w-3 h-3" />{staffCount} staff
                                                </span>
                                            </div>
                                            {role.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        {hasPermission('team.roles.manage') && (
                                            <>
                                                <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(role.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => setExpandedRole(isExpanded ? null : role.id)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors ml-1">
                                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border p-5 bg-muted/20">
                                        {Object.keys(permsByModule).length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic text-center py-2">No permissions assigned</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {Object.entries(permsByModule).map(([module, labels]) => (
                                                    <div key={module} className="space-y-2">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1">{module} Module</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {labels.map((label) => (
                                                                <span key={label} className="text-[11px] px-2.5 py-1 bg-background border border-border text-foreground rounded flex items-center gap-1.5 shadow-sm">
                                                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                                                    {label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Role Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto pt-20">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">
                                    {editingRole ? "Edit Role" : "Create New Role"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Define access level for your staff members</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role Name *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Store Manager"
                                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                                    <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of this role"
                                        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                                </div>
                            </div>

                            {/* Permissions selector */}
                            <div>
                                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5" /> Capabilities
                                    </label>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded capitalize">
                                        {form.permissionKeys.length} Permissions Selected
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {Object.entries(permissionGroups).map(([module, perms]) => {
                                        const isModExpanded = expandedModules.includes(module);
                                        const moduleKeys = perms.map((p) => p.key);
                                        const allSelected = moduleKeys.every((k) => form.permissionKeys.includes(k));
                                        const someSelected = moduleKeys.some((k) => form.permissionKeys.includes(k));

                                        return (
                                            <div key={module} className="border border-border rounded-xl overflow-hidden bg-background shadow-sm hover:border-primary/20 transition-all">
                                                <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                                                    <button type="button" onClick={() => toggleModule(module)} className="flex items-center gap-2 flex-1 text-left py-1">
                                                        {isModExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">{module}</span>
                                                        <span className="text-[10px] text-muted-foreground">({perms.length})</span>
                                                    </button>
                                                    <button type="button" onClick={() => selectAllInModule(module)}
                                                        className={`text-[9px] px-2 py-0.5 rounded border uppercase font-black transition-all ${allSelected ? "bg-primary border-primary text-primary-foreground" : someSelected ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}>
                                                        {allSelected ? "None" : "All"}
                                                    </button>
                                                </div>
                                                {isModExpanded && (
                                                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background">
                                                        {perms.map((perm) => {
                                                            const selected = form.permissionKeys.includes(perm.key);
                                                            return (
                                                                <button key={perm.key} type="button" onClick={() => togglePermission(perm.key)}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left group ${selected ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border bg-background text-foreground hover:bg-muted/30 hover:border-primary/30"}`}>
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                                                                        {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                                                    </div>
                                                                    <span className="text-[11px] font-medium">{perm.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-6 border-t border-border bg-muted/30">
                            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-bold hover:bg-background transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                                {saving ? "Processing..." : editingRole ? "Save changes" : "Create role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl w-full max-sm text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 border-4 border-destructive/5">
                            <Trash2 className="w-7 h-7 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Confirm Deletion</h3>
                        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to remove the <span className="text-foreground font-bold">{roles.find(r => r.id === deleteConfirm)?.name}</span> role? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-bold hover:bg-muted/50 transition-colors">Abort</button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-bold hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20">Delete Role</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
