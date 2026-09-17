import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Temple Pooja Management
export const fetchMyPoojas = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/poojas?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMyPooja = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/poojas`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateMyPooja = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/poojas/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteMyPooja = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/poojas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const togglePoojaStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/temple-admin/poojas/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Temple Event Management
export const fetchMyEvents = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/events?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMyEvent = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMyEvent = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/events/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMyEvent = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleEventStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/temple-admin/events/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Public/Registration Actions
export const registerTemple = async (formData: FormData) => {
    const response = await axios.post(`${API_URL}/temple-admin/temples/register`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const fetchAllPoojasPublic = async () => {
    const response = await axios.get(`${API_URL}/temples/poojas`);
    return response.data;
};

// Temple Profile Management
export const fetchMyTempleProfile = async () => {
    const token = localStorage.getItem("token");
    const url = `${API_URL}/temple-admin/temples/profile?lang=raw`;
    console.log(`GET: ${url}`);
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMyTempleProfile = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/temples/profile`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// Temple Booking Management
export const fetchMyTempleBookings = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateBookingStatus = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const isFormData = data instanceof FormData;

    const response = await axios.patch(`${API_URL}/temple-admin/bookings/${id}/status`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData && { 'Content-Type': 'multipart/form-data' })
        }
    });
    return response.data;
};

export const deleteBooking = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const setTempleAvailability = async (data: { poojaId?: string; date: string; maxBookings?: number; isClosed?: boolean }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/bookings/availability`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getTempleAvailability = async (params: { month?: string; year?: string; poojaId?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/bookings/availability`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

// Temple Order Management
export const fetchTempleOrders = async (templeId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/orders/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSubOrderStatus = async (subOrderId: string, data: { status: string; shippingLabel?: string; templeId: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/temple-admin/orders/sub-order/${subOrderId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Temple Finance Management
export const fetchTempleLedger = async (templeId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/finance/ledger/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleFinanceSummary = async (templeId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/finance/summary/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const requestWithdrawal = async (data: { templeId: string; amount: number; bankDetails: any }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/finance/withdraw`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Temple Product Management
export const fetchMyProducts = async (params: any = {}) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/products?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const fetchMyProductById = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/products/${id}?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchCategories = async () => {
    // Currently using the public admin endpoint
    const response = await axios.get(`${API_URL}/admin/categories/active`);
    return response.data.data;
};

// Pooja Categories (Master List)
export const fetchPoojaCategories = async () => {
    const response = await axios.get(`${API_URL}/pooja-categories`);
    return response.data;
};

export const suggestPoojaCategory = async (name: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/pooja-categories/suggest`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMyProduct = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/products`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateMyProduct = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/products/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteMyProduct = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMyTempleDevotees = async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    dobStart?: string; 
    dobEnd?: string; 
    anniversaryStart?: string; 
    anniversaryEnd?: string;
}) => {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/temple-admin/devotees`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.dobStart) query.append('dobStart', params.dobStart);
        if (params.dobEnd) query.append('dobEnd', params.dobEnd);
        if (params.anniversaryStart) query.append('anniversaryStart', params.anniversaryStart);
        if (params.anniversaryEnd) query.append('anniversaryEnd', params.anniversaryEnd);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchDevoteeDetailMyTemple = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/devotees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Temple Staff Authentication
export const staffLogin = async (data: any) => {
    const response = await axios.post(`${API_URL}/temple-admin/team/login`, data);
    return response.data;
};

// Temple Team Management
export const fetchStaffMembers = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/team/staff`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createStaffMember = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/team/staff`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateStaffMember = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/temple-admin/team/staff/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteStaffMember = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/team/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchRoles = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/team/roles`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createRole = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/team/roles`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateRole = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/temple-admin/team/roles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteRole = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/team/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchPermissions = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/team/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


export const downloadDonationsExcel = async (templeId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/donations/${templeId}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    });
    return response.data;
};

export const downloadDonationsPdf = async (templeId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/donations/${templeId}/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    });
    return response.data;
};

export const createOfflineBookingTemple = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/bookings`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const lookupDevoteeByPhoneTemple = async (phone: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/bookings/devotee-lookup?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleOfflinePoojaLeads = async (params?: { search?: string, page?: number, limit?: number }) => {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/temple-admin/bookings/offline-leads`;
    if (params) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createOfflineTempleOrder = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/orders/offline`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Bulk Operations
export const createBulkMyProducts = async (data: { products: any[] }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/products/bulk`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createBulkMyPoojas = async (data: { poojas: any[] }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/poojas/bulk`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createBulkMyEvents = async (data: { events: any[] }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/events/bulk`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ─── Temple Expense Management APIs ─────────────────────────────────────────
export const fetchTempleExpenses = async (params?: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const fetchTempleExpenseStats = async (params?: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/expenses/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const createTempleExpense = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/expenses`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateTempleExpense = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/expenses/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteTempleExpense = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const uploadTempleExpenseReceipt = async (file: File) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_URL}/temple-admin/expenses/upload-receipt`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

// Temple Expense Categories APIs
export const fetchTempleExpenseCategories = async (params?: { search?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/expenses/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const createTempleExpenseCategory = async (data: { name: string; description?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/temple-admin/expenses/categories`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateTempleExpenseCategory = async (id: string, data: { name?: string; description?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/temple-admin/expenses/categories/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteTempleExpenseCategory = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/temple-admin/expenses/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

