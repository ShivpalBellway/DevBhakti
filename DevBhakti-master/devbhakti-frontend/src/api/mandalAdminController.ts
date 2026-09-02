import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Mandal Profile Management
export const fetchMandalProfile = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/profile?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalProfile = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/mandal-admin/profile`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// Mandal Event Management
export const fetchMandalEvents = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/events?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMandalEvent = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalEvent = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/mandal-admin/events/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMandalEvent = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleMandalEventStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/mandal-admin/events/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Donations Management
export const fetchMandalDonations = async (params?: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/donations`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const createMandalDonation = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/donations`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMandalDonation = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMandalDonationStats = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/donations/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Finance (Ledger & Payouts)
export const fetchMandalFinanceSummary = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMandalLedger = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const requestMandalWithdrawal = async (data: { amount: number; bankDetails: any }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/finance/withdraw`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Team & Staff Management
export const fetchMandalStaff = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/team/staff`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMandalStaff = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/team/staff`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalStaff = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/mandal-admin/team/staff/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMandalStaff = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/team/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const resetMandalStaffPassword = async (id: string, data: { newPassword: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/team/staff/${id}/reset-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Roles & Permissions Management
export const fetchMandalRoles = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/team/roles`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMandalRole = async (data: { name: string; description?: string; permissionKeys: string[] }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/team/roles`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalRole = async (id: string, data: { name?: string; description?: string; permissionKeys?: string[] }) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/mandal-admin/team/roles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMandalRole = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/team/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMandalPermissions = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/team/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Poojas Management
export const fetchMyMandalPoojas = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/poojas?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMandalPooja = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/poojas`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateMandalPooja = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/mandal-admin/poojas/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteMandalPooja = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/poojas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleMandalPoojaStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/mandal-admin/poojas/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Mandal Bookings Management
export const fetchMyMandalBookings = async (params?: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const createOfflineBookingMandal = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/bookings`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteMandalBooking = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMandalBookingById = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const lookupDevoteeByPhoneMandal = async (phone: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/bookings/devotee-lookup?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMandalOfflinePoojaLeads = async (params?: { search?: string, page?: number, limit?: number }) => {
    const token = localStorage.getItem("token");
    let url = `${API_URL}/mandal-admin/bookings/offline-leads`;
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

// ─── Mandal Product Management ──────────────────────────────────────────────
export const fetchMandalProducts = async (params?: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/products?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const fetchMandalProductById = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/products/${id}?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createMandalProduct = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/mandal-admin/products`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateMandalProduct = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/mandal-admin/products/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteMandalProduct = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/mandal-admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ─── Mandal Order Management ────────────────────────────────────────────────
export const fetchMandalOrders = async (mandalId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/mandal-admin/orders/${mandalId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalOrderStatus = async (subOrderId: string, data: { status: string; mandalId: string; shippingLabel?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/mandal-admin/orders/sub-order/${subOrderId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
