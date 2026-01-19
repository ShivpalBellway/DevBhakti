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
