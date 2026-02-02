import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export const createOrder = async (orderData: any) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMyOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, data: [] };

    const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchOrderById = async (orderId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchOrderInvoice = async (orderId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text' // We expect HTML string
    });
    return response.data; // This will be the HTML string
};
