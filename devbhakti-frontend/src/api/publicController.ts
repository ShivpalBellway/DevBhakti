import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export const fetchPublicTemples = async () => {
    try {
        const response = await axios.get(`${API_URL}/temples`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public temples:", error);
        return [];
    }
};

export const fetchPublicPoojas = async () => {
    try {
        const response = await axios.get(`${API_URL}/temples/poojas`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public poojas:", error);
        return [];
    }
};

export const fetchPublicTempleById = async (id: string) => {
    try {
        const response = await axios.get(`${API_URL}/temples/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public temple by id:", error);
        return null;
    }
};

export const fetchPublicPoojaById = async (id: string) => {
    try {
        const response = await axios.get(`${API_URL}/temples/poojas/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public pooja by id:", error);
        return null;
    }
};
