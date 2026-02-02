import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Seller Product Management
export const fetchSellerProducts = async (params: any = {}) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const fetchSellerProductById = async (id: string) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createSellerProduct = async (formData: FormData) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.post(`${API_URL}/seller/products`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateSellerProduct = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.put(`${API_URL}/seller/products/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteSellerProduct = async (id: string) => {
    const token = localStorage.getItem("seller_token");
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
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSellerSubOrderStatus = async (subOrderId: string, data: { status: string; shippingLabel?: string }) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.patch(`${API_URL}/seller/orders/sub-order/${subOrderId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerCustomers = async () => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/orders/customers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerProfile = async () => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSellerProfile = async (formData: FormData) => {
    const token = localStorage.getItem("seller_token");
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
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/finance/summary`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchSellerFinanceLedger = async () => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.get(`${API_URL}/seller/finance/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const requestSellerWithdrawal = async (data: { amount: number; bankDetails?: any }) => {
    const token = localStorage.getItem("seller_token");
    const response = await axios.post(`${API_URL}/seller/finance/withdraw`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
