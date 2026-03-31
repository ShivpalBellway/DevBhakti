import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export const fetchPublicTemples = async (params?: {
    search?: string;
    category?: string;
    location?: string;
    pooja?: string;
    poojaId?: string;
    isLive?: boolean | string;
}) => {
    try {
        const response = await axios.get(`${API_URL}/temples`, { params });
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public temples:", error);
        return [];
    }
};

export const fetchPublicFilters = async () => {
    try {
        const response = await axios.get(`${API_URL}/temples/filters`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching public filters:", error);
        return { categories: [], locations: [], poojas: [] };
    }
};

export const fetchPublicPoojas = async (params?: {
    search?: string;
    category?: string;
    location?: string;
    templeId?: string;
}) => {
    try {
        const response = await axios.get(`${API_URL}/temples/poojas`, { params });
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

// Get Public Products (for landing page)
export const fetchPublicProducts = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    templeId?: string;
}) => {
    try {
        const response = await axios.get(`${API_URL}/admin/products/public`, {
            params
        });
        return response.data.data.products;
    } catch (error) {
        console.error("Error fetching public products:", error);
        return [];
    }
};

// Get Product by ID (public)
export const fetchProductByIdPublic = async (id: string) => {
    try {
        const response = await axios.get(`${API_URL}/admin/products/public/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching product by id:", error);
        return null;
    }
};

export const fetchRatingsSettings = async () => {

    try {
        const response = await axios.get(`${API_URL}/admin/settings/ratings`);
        return response.data;
    } catch (error) {
        console.error("Error fetching ratings settings:", error);
        return {
            success: false, settings: {
                temple: { home: false, details: false },
                product: { home: false, details: false },
                pooja: { home: false, details: false }
            }
        };
    }
};

export const fetchSeoSettings = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/settings/seo-public`);
        return response.data;
    } catch (error) {
        console.error("Error fetching SEO settings:", error);
        return {
            success: false,
            settings: {
                home: { title: "DevBhakti - Sacred Temple Service", description: "Connecting devotees with sacred temples", keywords: "temple, pooja, darshan" }
            }
        };
    }
};

// Fetch active Standard FAQs (for pooja detail pages)
export const fetchStandardFAQs = async () => {
    try {
        const response = await axios.get(`${API_URL}/faqs`);
        return response.data.data as { id: string; question: string; answer: string; order: number }[];
    } catch (error) {
        console.error("Error fetching standard FAQs:", error);
        return [];
    }
};





