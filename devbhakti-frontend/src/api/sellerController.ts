import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Public/Registration Actions
export const registerSeller = async (data: any) => {
    const response = await axios.post(`${API_URL}/seller/register`, data);
    return response.data;
};

// Seller Product Management
export const fetchSellerProducts = async (params: any = {}) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const fetchSellerProductById = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createSellerProduct = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/seller/products`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateSellerProduct = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/seller/products/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteSellerProduct = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchCategories = async () => {
    const response = await axios.get(`${API_URL}/admin/categories/active`);
    return response.data.data;
};

// Seller Order Management
export const fetchSellerOrders = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSellerSubOrderStatus = async (subOrderId: string, data: { status: string; shippingLabel?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/seller/orders/sub-order/${subOrderId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerCustomers = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/orders/customers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerProfile = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSellerProfile = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/seller/profile`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

// Seller Finance Management
export const fetchSellerFinanceSummary = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerFinanceLedger = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const requestSellerWithdrawal = async (data: { amount: number; bankDetails?: any }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/seller/finance/withdraw`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerWithdrawalHistory = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/finance/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Seller Team Management (Staff)
export const fetchSellerStaffMembers = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/team/staff`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const staffLogin = async (data: any) => {
    const response = await axios.post(`${API_URL}/seller/team/login`, data);
    return response.data;
};

export const createSellerStaffMember = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/seller/team/staff`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateSellerStaffMember = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/seller/team/staff/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteSellerStaffMember = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/seller/team/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// Seller Team Management (Roles)
export const fetchSellerRoles = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/team/roles`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createSellerRole = async (data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/seller/team/roles`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateSellerRole = async (id: string, data: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/seller/team/roles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteSellerRole = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/seller/team/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const fetchSellerPermissions = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/seller/team/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
