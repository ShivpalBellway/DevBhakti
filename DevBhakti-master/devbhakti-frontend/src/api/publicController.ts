    import axios from "axios";
    import { API_URL } from "@/config/apiConfig";

    export const fetchPublicTemples = async (params?: {
        search?: string;
        category?: string;
        location?: string;
        pooja?: string;
        poojaId?: string;
        lang?: string;
    }) => {
        try {
            const response = await axios.get(`${API_URL}/temples`, { params });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching public temples:", error);
            return [];
        }
    };

    export const fetchPublicFilters = async (lang?: string) => {
        try {
            const response = await axios.get(`${API_URL}/temples/filters`, {
                params: { lang }
            });
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
        lang?: string;
    }) => {
        try {
            const response = await axios.get(`${API_URL}/temples/poojas`, { params });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching public poojas:", error);
            return [];
        }
    };

    export const fetchPublicTempleById = async (id: string, lang?: string) => {
        try {
            const response = await axios.get(`${API_URL}/temples/${id}`, { 
                params: { lang } 
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching public temple by id:", error);
            return null;
        }
    };

    export const fetchPublicPoojaById = async (id: string, lang?: string) => {
        try {
            const response = await axios.get(`${API_URL}/temples/poojas/${id}`, {
                params: { lang }
            });
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
        mandalId?: string;
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
        lang?: string;
    }) => {
        try {
            const response = await axios.get(`${API_URL}/admin/products/public`, {
                params
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching public products:", error);
            return { products: [], pagination: { total: 0, pages: 0 } };
        }
    };

    // Get Product by ID (public)
    export const fetchProductByIdPublic = async (id: string, lang?: string) => {
        try {
            const response = await axios.get(`${API_URL}/admin/products/public/${id}`, {
                params: { lang }
            });
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

    export const submitContactForm = async (data: {
        name: string;
        email: string;
        mobile: string;
        subject: string;
        message: string;
    }) => {
        try {
            const response = await axios.post(`${API_URL}/contact`, data);
            return response.data;
        } catch (error: any) {
            console.error("Error submitting contact form:", error);
            return {
                success: false,
                error: error.response?.data?.error || "Failed to submit inquiry. Please try again later."
            };
        }
    };

    export const calculateDonationFee = async (amount: number) => {
        try {
            const response = await axios.get(`${API_URL}/donations/calculate-fee`, { params: { amount } });
            return response.data;
        } catch (error) {
            console.error("Error calculating donation fee:", error);
            return { success: false, platformFee: 0, totalPayable: amount };
        }
    };

    export const fetchMandalRegistrationStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/settings/mandal-registration`);
            return response.data;
        } catch (error) {
            console.error("Error fetching mandal registration status:", error);
            return { success: false, enabled: false };
        }
    };

    export const submitMandalRegistration = async (data: FormData | any) => {
        try {
            const response = await axios.post(`${API_URL}/mandals/register`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error("Error submitting mandal registration:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Failed to submit mandal registration"
            };
        }
    };