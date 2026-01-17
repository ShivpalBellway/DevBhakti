import axios from "axios";
import { API_URL } from "../config/apiConfig";

// Admin Login
export const loginAdmin = async (formData: any) => {
    const response = await axios.post(`${API_URL}/admin/auth/login`, formData);
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
