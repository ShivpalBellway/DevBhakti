import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Temple Pooja Management
export const fetchMyPoojas = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/temple-admin/poojas`, {
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
    const response = await axios.get(`${API_URL}/temple-admin/events`, {
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
    const response = await axios.get(`${API_URL}/temple-admin/temples/profile`, {
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
