import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Admin Auth
export const loginAdmin = async (credentials: any) => {
    const response = await axios.post(`${API_URL}/admin/auth/login`, credentials);
    return response.data;
};

// Admin Temple Management
export const fetchAllTemplesAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/temples`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const approveTempleAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Pooja Management
export const fetchAllPoojasAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/poojas`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createPoojaAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/poojas`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updatePoojaAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/poojas/${id}`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deletePoojaAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/poojas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Event Management
export const fetchAllEventsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchEventsByTemple = async (templeId: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/events/temple/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createEventAdmin = async (data: any) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateEventAdmin = async (id: string, data: any) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/events/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteEventAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Institution Management
export const fetchAllInstitutionsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/institutions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createInstitutionAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/institutions`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateInstitutionAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/institutions/${id}`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteInstitutionAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/institutions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
