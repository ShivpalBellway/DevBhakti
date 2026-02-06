'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { API_URL } from '@/config/apiConfig';

interface CommissionSlab {
    id: string;
    minAmount: number;
    maxAmount: number | null;
    platformFee: number;
    percentage: number;
    slabType: 'GLOBAL' | 'TEMPLE' | 'SELLER';
    targetId: string | null;
    isActive: boolean;
}

export default function CommissionSlabsPage() {
    const [slabs, setSlabs] = useState<CommissionSlab[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'MARKETPLACE' | 'POOJA'>('MARKETPLACE');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        minAmount: '',
        maxAmount: '',
        platformFee: '',
        percentage: '',
    });

    useEffect(() => {
        fetchSlabs();
    }, [activeCategory]);

    const fetchSlabs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_URL}/admin/commission-slabs?type=GLOBAL&category=${activeCategory}`, {
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
            console.log('Creating slab with data:', formData);
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_URL}/admin/commission-slabs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    slabType: 'GLOBAL',
                    category: activeCategory
                }),
            });
            const data = await response.json();
            console.log('Response:', data);

            if (data.success) {
                fetchSlabs();
                setIsCreating(false);
                setFormData({ minAmount: '', maxAmount: '', platformFee: '', percentage: '' });
                alert('Slab created successfully!');
            } else {
                alert(`Failed to create slab: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating slab:', error);
            alert('Failed to create slab: ' + error);
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_URL}/admin/commission-slabs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    category: activeCategory
                }),
            });
            const data = await response.json();
            if (data.success) {
                fetchSlabs();
                setEditingId(null);
                setFormData({ minAmount: '', maxAmount: '', platformFee: '', percentage: '' });
                alert('Slab updated successfully!');
            }
        } catch (error) {
            console.error('Error updating slab:', error);
            alert('Failed to update slab');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slab?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API_URL}/admin/commission-slabs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                fetchSlabs();
                alert('Slab deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting slab:', error);
            alert('Failed to delete slab');
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
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ minAmount: '', maxAmount: '', platformFee: '', percentage: '' });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Commission Slabs</h1>
                    <p className="text-gray-600 mt-2">
                        Manage platform fees based on the order value.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                >
                    <Plus size={20} />
                    Add New Slab
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveCategory('MARKETPLACE')}
                    className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${activeCategory === 'MARKETPLACE'
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Marketplace (Products)
                </button>
                <button
                    onClick={() => setActiveCategory('POOJA')}
                    className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${activeCategory === 'POOJA'
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Pooja Bookings
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-orange-500">
                    <h3 className="text-xl font-semibold mb-4">Create New Slab</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.minAmount}
                                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.maxAmount}
                                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Leave empty for unlimited"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Platform Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.platformFee}
                                onChange={(e) => setFormData({ ...formData, platformFee: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Percentage (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.percentage}
                                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="5"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                            <Save size={18} />
                            Save
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Slabs Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Range
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Platform Fee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Percentage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Example (₹1000)
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {slabs.map((slab) => (
                            <tr key={slab.id} className={editingId === slab.id ? 'bg-orange-50' : ''}>
                                {editingId === slab.id ? (
                                    <>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={formData.minAmount}
                                                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                                    className="w-24 px-2 py-1 border rounded"
                                                />
                                                <span className="self-center">to</span>
                                                <input
                                                    type="number"
                                                    value={formData.maxAmount}
                                                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                                    className="w-24 px-2 py-1 border rounded"
                                                    placeholder="∞"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                value={formData.platformFee}
                                                onChange={(e) => setFormData({ ...formData, platformFee: e.target.value })}
                                                className="w-24 px-2 py-1 border rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.percentage}
                                                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                                className="w-24 px-2 py-1 border rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleUpdate(slab.id)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="text-gray-600 hover:text-gray-800"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ₹{slab.minAmount.toLocaleString()} - {slab.maxAmount ? `₹${slab.maxAmount.toLocaleString()}` : '∞'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">₹{slab.platformFee}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{slab.percentage}%</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                ₹{slab.platformFee + (1000 * slab.percentage / 100)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => startEdit(slab)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(slab.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {slabs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No commission slabs found</p>
                        <p className="text-sm mt-2">Click "Add New Slab" to create your first slab</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Slabs define platform fees based on order value ranges</li>
                    <li>• Each slab has a fixed fee (₹) + percentage (%)</li>
                    <li>• User pays the platform fee on top of product prices</li>
                    <li>• Vendors receive 100% of their product prices</li>
                    <li>• For multi-vendor orders, fees are calculated per vendor</li>
                </ul>
            </div>
        </div>
    );
}
