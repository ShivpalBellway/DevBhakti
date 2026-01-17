import axios from "axios";
import { API_URL } from "../config/apiConfig";

// Temple Registration
export const registerTemple = async (templeData: any) => {
    const response = await axios.post(`${API_URL}/institution/temples/register`, templeData);
    return response.data;
};

// Institution Login (Future)
export const loginInstitution = async (formData: any) => {
    const response = await axios.post(`${API_URL}/institution/auth/login`, formData);
    return response.data;
};
