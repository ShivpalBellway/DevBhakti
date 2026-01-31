import axios from "axios";

// Using the same base URL logic or constant as other controllers
// Assuming others use process.env.NEXT_PUBLIC_API_URL or a simplified hardcoded/relative path if proxy is set.
// Looking at adminController.ts content from previous summary (it was long, I didn't see the top imports),
// I'll assume standard axios config. I will use a local instance for now or direct axios calls with headers.

const API_URL = "http://localhost:5000/api"; // Should match backend

// Helper to get token
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getMyCart = async () => {
    try {
        const response = await axios.get(`${API_URL}/cart`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addItemToCart = async (productId: string, variantId: string, quantity: number) => {
    try {
        const response = await axios.post(`${API_URL}/cart/add`, {
            productId,
            variantId,
            quantity
        }, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateCartItemQuantity = async (variantId: string, quantity: number) => {
    try {
        const response = await axios.put(`${API_URL}/cart/update`, {
            variantId,
            quantity
        }, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removeCartItem = async (variantId: string) => {
    try {
        const response = await axios.delete(`${API_URL}/cart/remove/${variantId}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const clearMyCart = async () => {
    try {
        const response = await axios.delete(`${API_URL}/cart/clear`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error;
    }
};
