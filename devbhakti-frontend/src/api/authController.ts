import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export const sendOTP = async (data: { phone: string; name?: string; email?: string; role?: string }) => {
    const response = await axios.post(`${API_URL}/auth/send-otp`, data);
    return response.data;
};

export const verifyOTP = async (phone: string, otp: string, role?: string) => {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, { phone, otp, role });
    return response.data;
};

export const updateProfile = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/auth/profile`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
export const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};
