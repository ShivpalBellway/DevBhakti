import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export const sendOTP = async (data: { phone: string; name?: string; email?: string }) => {
    const response = await axios.post(`${API_URL}/auth/send-otp`, data);
    return response.data;
};

export const verifyOTP = async (phone: string, otp: string) => {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, { phone, otp });
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
