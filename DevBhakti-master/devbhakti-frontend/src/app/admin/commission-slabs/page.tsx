'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Store } from 'lucide-react';
import { API_URL } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

interface CommissionSlab {
    id: string;
    minAmount: number;
    maxAmount: number | null;
    platformFee: number;
    percentage: number;
    slabType: 'GLOBAL' | 'TEMPLE' | 'MANDAL' | 'SELLER';
    isOffline: boolean;
    targetId: string | null;
    isActive: boolean;
}

export default function CommissionSlabsPage() {
    const { toast } = useToast();
    const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
    const [activeCategory, setActiveCategory] = useState<'MARKETPLACE' | 'POOJA' | 'DONATION'>('MARKETPLACE');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        minAmount: '0',
        maxAmount: '',
        platformFee: '0',
        percentage: '',
    });

    useEffect(() => {
        fetchSlabs();
    }, [activeMode, activeCategory]);

    const fetchSlabs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const isOfflineParam = activeMode === 'OFFLINE';
            const response = await fetch(`${API_URL}/admin/commission-slabs?type=GLOBAL&category=${activeCategory}&isOffline=${isOfflineParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setSlabs(data.data);
            }
        } catch (error) {
            console.error('Error fetching slabs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const body = { 
                ...formData, 
                slabType: 'GLOBAL', 
                category: activeCategory,
                isOffline: activeMode === 'OFFLINE'
            };

            const response = await fetch(`${API_URL}/admin/commission-slabs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (data.success) {
                fetchSlabs();
                setIsCreating(false);
                setFormData({ minAmount: '0', maxAmount: '', platformFee: '0', percentage: '' });
                toast({
                    title: 'Success!',
                    description: 'Commission Slab created successfully.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to create slab',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create slab',
                variant: 'destructive',
            });
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const body = { 
                ...formData, 
                category: activeCategory,
                isOffline: activeMode === 'OFFLINE'
            };

            const response = await fetch(`${API_URL}/admin/commission-slabs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.success) {
                fetchSlabs();
                setEditingId(null);
                setIsCreating(false);
                setFormData({ minAmount: '0', maxAmount: '', platformFee: '0', percentage: '' });
                toast({
                    title: 'Updated!',
                    description: 'Commission Slab updated successfully.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to update slab',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update slab',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slab?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_URL}/admin/commission-slabs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                fetchSlabs();
                toast({
                    title: 'Deleted!',
                    description: 'Commission Slab deleted successfully.',
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (slab: CommissionSlab) => {
        setEditingId(slab.id);
        setFormData({
            minAmount: slab.minAmount.toString(),
            maxAmount: slab.maxAmount?.toString() || '',
            platformFee: slab.platformFee.toString(),
            percentage: slab.percentage.toString(),
        });
        setIsCreating(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ minAmount: '0', maxAmount: '', platformFee: '0', percentage: '' });
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Commission Slabs</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">
                        Manage platform fees for Marketplace, Pooja, and Donations across Online and Offline modes.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200 font-bold text-sm"
                >
                    <Plus size={20} />
                    Add New {activeMode === 'ONLINE' ? 'Online' : 'Offline'} Slab
                </button>
            </div>

            {/* Mode Selector (Online vs Offline Slabs) */}
            <div className="flex items-center gap-3 mb-6 bg-amber-500/10 p-1.5 rounded-2xl w-fit border border-amber-200">
                <button
                    onClick={() => {
                        setActiveMode('ONLINE');
                        setEditingId(null);
                        setIsCreating(false);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeMode === 'ONLINE'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Globe size={18} />
                    🌐 Online Slabs
                </button>
                <button
                    onClick={() => {
                        setActiveMode('OFFLINE');
                        setEditingId(null);
                        setIsCreating(false);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeMode === 'OFFLINE'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Store size={18} />
                    🏢 Offline / Counter Slabs
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                {['MARKETPLACE', 'POOJA', 'DONATION'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => {
                            setActiveCategory(cat as any);
                            setEditingId(null);
                            setIsCreating(false);
                        }}
                        className={`whitespace-nowrap px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                            activeCategory === cat
                                ? 'border-orange-600 text-orange-600 font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {cat === 'MARKETPLACE' ? 'Marketplace (Products)' : cat === 'POOJA' ? 'Pooja Bookings' : 'Donations'}
                    </button>
                ))}
            </div>

            {/* Slabs Form */}
            {isCreating && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-orange-500 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold mb-6">
                        {editingId ? 'Edit' : 'Create New'} {activeMode === 'ONLINE' ? 'Online' : 'Offline'} ({activeCategory}) Slab
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Min Amount (₹)</label>
                            <input
                                type="number"
                                value={formData.minAmount}
                                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Max Amount (₹)</label>
                            <input
                                type="number"
                                value={formData.maxAmount}
                                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Unlimited"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Fixed Fee (₹)</label>
                            <input
                                type="number"
                                value={formData.platformFee}
                                onChange={(e) => setFormData({ ...formData, platformFee: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Percentage (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.percentage}
                                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={editingId ? () => handleUpdate(editingId) : handleCreate} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100">
                            {editingId ? 'Update Slab' : 'Save Slab'}
                        </button>
                        <button onClick={cancelEdit} className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                    </div>
                </div>
            )}

            {/* Slabs Table */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Amount Range</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Platform Fee (₹)</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Commission (%)</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Mode</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">Loading commission slabs...</td>
                                </tr>
                            ) : slabs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">No {activeMode === 'ONLINE' ? 'Online' : 'Offline'} commission slabs found for {activeCategory}. Click &quot;Add New Slab&quot; to create one.</td>
                                </tr>
                            ) : (
                                slabs.map((slab) => (
                                    <tr key={slab.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-gray-700">₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : 'No Limit'}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm">₹{slab.platformFee}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm">{slab.percentage}%</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-lg font-bold text-xs ${slab.isOffline ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                {slab.isOffline ? '🏢 Offline / Counter' : '🌐 Online'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => startEdit(slab)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(slab.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}