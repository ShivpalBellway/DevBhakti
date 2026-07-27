import axios from "axios";
import { API_URL } from "@/config/apiConfig";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
    return { Authorization: `Bearer ${token}` };
};

export const fetchPhotoSettings = async () => {
    const response = await axios.get(`${API_URL}/temple-admin/photography/settings`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updatePhotoSettings = async (data: any) => {
    const response = await axios.put(`${API_URL}/temple-admin/photography/settings`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createPhotoPackage = async (data: any) => {
    const response = await axios.post(`${API_URL}/temple-admin/photography/packages`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updatePhotoPackage = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/temple-admin/photography/packages/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deletePhotoPackage = async (id: string) => {
    const response = await axios.delete(`${API_URL}/temple-admin/photography/packages/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createPhotoSlot = async (data: any) => {
    const response = await axios.post(`${API_URL}/temple-admin/photography/slots`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updatePhotoSlot = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/temple-admin/photography/slots/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deletePhotoSlot = async (id: string) => {
    const response = await axios.delete(`${API_URL}/temple-admin/photography/slots/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const fetchPhotoBookings = async () => {
    const response = await axios.get(`${API_URL}/temple-admin/photography/bookings`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const verifyPhotoTicket = async (data: { bookingId?: string; displayId?: string }) => {
    const response = await axios.post(`${API_URL}/temple-admin/photography/verify-ticket`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deletePhotoBooking = async (id: string) => {
    const response = await axios.delete(`${API_URL}/temple-admin/photography/bookings/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};
