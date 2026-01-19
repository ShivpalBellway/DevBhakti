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

// Fetch Single Pooja
export const fetchPoojaById = async (id: string) => {
    const response = await axios.get(`${API_URL}/temples/poojas/${id}`);
    return response.data;
};
