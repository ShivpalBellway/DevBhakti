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

export const fetchMyBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, data: [] };
    const response = await axios.get(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMyDonations = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, data: [] };
    try {
        const response = await axios.get(`${API_URL}/donations/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Fetch donations failed", error);
        return { success: false, data: [] };
    }
};

export const downloadBookingReceipt = async (bookingId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false };

    try {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}/receipt`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Download failed", error);
        return { success: false };
    }
};

export const downloadDonationReceipt = async (donationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false };

    try {
        const response = await axios.get(`${API_URL}/donations/${donationId}/receipt`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Donation download failed", error);
        return { success: false };
    }
};
