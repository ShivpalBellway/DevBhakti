import axios from "axios";
import { API_URL } from "../config/apiConfig";

// Devotee/User Login (Future)
export const loginUser = async (formData: any) => {
    const response = await axios.post(`${API_URL}/user/auth/login`, formData);
    return response.data;
};

// Fetch Public Temples
export const fetchPublicTemples = async () => {
    const response = await axios.get(`${API_URL}/temples`);
    return response.data;
};

// Favorites Management
export const fetchUserFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, data: [] };
    const response = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const addFavorite = async (data: { templeId?: string; poojaId?: string; productId?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/favorites/add`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const removeFavorite = async (data: { templeId?: string; poojaId?: string; productId?: string }) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/favorites/remove`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
