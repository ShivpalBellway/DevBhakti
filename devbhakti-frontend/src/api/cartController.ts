import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Using the same base URL logic or constant as other controllers

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
