import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Admin Auth
export const loginAdmin = async (credentials: any) => {
    const response = await axios.post(`${API_URL}/admin/auth/login`, credentials);
    return response.data;
};

export const sendAdminPasswordChangeOTP = async (oldPassword: string) => {
    const token = getAdminToken();
    const response = await axios.post(
        `${API_URL}/admin/auth/send-change-password-otp`,
        { oldPassword },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const changeAdminPassword = async (oldPassword: string, otp: string, newPassword: string) => {
    const token = getAdminToken();
    const response = await axios.post(
        `${API_URL}/admin/auth/change-password`,
        { oldPassword, otp, newPassword },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Admin Temple Management
// (Consolidated below)

// Helper to get token (super admin or staff)
const getAdminToken = () => localStorage.getItem("admin_token") || localStorage.getItem("staff_token");

// Admin Pooja Management
export const fetchAllPoojasAdmin = async (params?: { isMaster?: boolean, templeId?: string, search?: string, poojaId?: string, lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/poojas`;
    if (params) {
        const query = new URLSearchParams();
        if (params.isMaster !== undefined) query.append('isMaster', params.isMaster.toString());
        if (params.templeId) query.append('templeId', params.templeId);
        if (params.search) query.append('search', params.search);
        if (params.poojaId) query.append('poojaId', params.poojaId);
        if (params.lang) query.append('lang', params.lang);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchMasterPoojasAdmin = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/poojas?isMaster=true`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const promotePoojaToMasterAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/poojas/${id}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createPoojaAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/poojas`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const fetchPoojaByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/poojas/${id}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'lang': 'raw'
        }
    });
    return response.data;
};

export const updatePoojaAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/poojas/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const togglePoojaStatusAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/poojas/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deletePoojaAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/poojas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Pooja Category Management
export const fetchPoojaCategoriesAdmin = async (params?: { status?: string, search?: string }) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/pooja-categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

export const createPoojaCategoryAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/pooja-categories`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updatePoojaCategoryAdmin = async (id: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/pooja-categories/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updatePoojaCategoryStatusAdmin = async (id: string, status: string) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/pooja-categories/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deletePoojaCategoryAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/pooja-categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Event Management
export const fetchAllEventsAdmin = async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    templeId?: string;
    date?: string;
}) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/events`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.templeId) query.append('templeId', params.templeId);
        if (params.date) query.append('date', params.date);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchEventsByTemple = async (templeId: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/events/temple/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createEventAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateEventAdmin = async (id: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/events/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteEventAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleEventStatusAdmin = async (id: string, status: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/events/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchEventByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


// Admin Temple Management
export const fetchAllTemplesAdmin = async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    isVerified?: boolean; 
    isActive?: boolean;
    templeId?: string; 
    date?: string; 
    startDate?: string;
    endDate?: string;
    deity?: string; 
    category?: string;
    state?: string; 
    district?: string; 
    location?: string;
    transactionRange?: string; 
    ritual?: string;
    lang?: string 
}) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/temples`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.isVerified !== undefined) query.append('isVerified', params.isVerified.toString());
        if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());
        if (params.templeId) query.append('templeId', params.templeId);
        if (params.date) query.append('date', params.date);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.deity) query.append('deity', params.deity);
        if (params.category) query.append('category', params.category);
        if (params.state) query.append('state', params.state);
        if (params.district) query.append('district', params.district);
        if (params.location) query.append('location', params.location);
        if (params.transactionRange) query.append('transactionRange', params.transactionRange);
        if (params.ritual) query.append('ritual', params.ritual);
        if (params.lang) query.append('lang', params.lang);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleByIdAdmin = async (id: string | number) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/temples/${id}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'lang': 'raw'
        }
    });
    return response.data;
};

export const fetchTempleCategories = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/temples/categories`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleLocations = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/temples/locations`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createTempleAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/temples`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateTempleAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/temples/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteTempleAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/temples/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleShowPhoneAdmin = async (id: string, showPhone: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/show-phone`, { showPhone }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleShowWebsiteAdmin = async (id: string, showWebsite: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/show-website`, { showWebsite }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleTempleStatusAdmin = async (id: string, isVerified: boolean, isActive: boolean, data?: { slug?: string, subdomain?: string, urlType?: string, productCommissionRate?: number, poojaCommissionRate?: number, liveStatus?: boolean, commissionSlabs?: any[] }) => {
    const token = getAdminToken();
    const payload = {
        isVerified,
        isActive,
        ...data
    };
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateTempleLiveConfigAdmin = async (id: string, data: { channelId?: string; liveUrl?: string; isLive?: boolean }) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/live-config`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const setPrimaryLiveAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/set-primary-live`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleUpdateRequests = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/temples/update-requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const approveTempleUpdate = async (requestId: string) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/temples/update-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const rejectTempleUpdate = async (requestId: string) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/temples/update-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin CMS Management
export const fetchAllBannersAdmin = async (params?: { lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/cms/banners`;
    if (params?.lang) url += `?lang=${params.lang}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createBannerAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/cms/banners`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateBannerAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/cms/banners/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteBannerAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/cms/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchBannerGlobalStatus = async () => {
    const response = await axios.get(`${API_URL}/admin/cms/banners/global-status`);
    return response.data;
};

export const toggleBannerGlobalStatus = async () => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/cms/banners/global-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchAllFeaturesAdmin = async (params?: { lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/cms/features`;
    if (params?.lang) url += `?lang=${params.lang}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createFeatureAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/cms/features`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateFeatureAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/cms/features/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteFeatureAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/cms/features/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


export const fetchAllTestimonialsAdmin = async (params?: { lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/cms/testimonials`;
    if (params?.lang) url += `?lang=${params.lang}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createTestimonialAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/cms/testimonials`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateTestimonialAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/cms/testimonials/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteTestimonialAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/cms/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// CTA Cards Management
export const fetchAllCTACardsAdmin = async (params?: { lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/cms/cta-cards`;
    if (params?.lang) url += `?lang=${params.lang}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createCTACardAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/cms/cta-cards`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateCTACardAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/cms/cta-cards/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteCTACardAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/cms/cta-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Pooja FAQs (Standard FAQs) Management
export const fetchAllPoojaFAQsAdmin = async (params?: { lang?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/cms/pooja-faqs`;
    if (params?.lang) url += `?lang=${params.lang}`;
    
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createPoojaFAQAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/cms/pooja-faqs`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updatePoojaFAQAdmin = async (id: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/cms/pooja-faqs/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deletePoojaFAQAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/cms/pooja-faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


// Admin Product Management
export const fetchAllProductsAdmin = async (params?: { page?: number; limit?: number; search?: string; status?: string; templeId?: string; date?: string; productId?: string; categoryId?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/products`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.productId) query.append('productId', params.productId);
        if (params.status) query.append('status', params.status);
        if (params.templeId) query.append('templeId', params.templeId);
        if (params.date) query.append('date', params.date);
        if (params.categoryId) query.append('categoryId', params.categoryId);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchProductOwnersAdmin = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/products/owners`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchProductByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/products/${id}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'lang': 'raw'
        }
    });
    return response.data.data;
};

export const createProductAdmin = async (productData: any) => {
    const token = getAdminToken();

    // Check if productData is FormData
    if (productData instanceof FormData) {
        const response = await axios.post(`${API_URL}/admin/products`, productData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type for FormData - let axios set it automatically
            }
        });
        return response.data;
    } else {
        // Handle JSON data
        const response = await axios.post(`${API_URL}/admin/products`, productData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export const updateProductAdmin = async (id: string, productData: any) => {
    const token = getAdminToken();

    // Check if productData is FormData
    if (productData instanceof FormData) {
        const response = await axios.put(`${API_URL}/admin/products/${id}`, productData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type for FormData - let axios set it automatically
            }
        });
        return response.data;
    } else {
        // Handle JSON data
        const response = await axios.put(`${API_URL}/admin/products/${id}`, productData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export const deleteProductAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Category Management
export const fetchAllCategoriesAdmin = async (params?: { isActive?: string, search?: string }) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...params, lang: 'raw' }
    });
    return response.data.data.categories;
};

export const fetchActiveCategoriesAdmin = async (params?: { lang?: string }) => {
    const response = await axios.get(`${API_URL}/admin/categories/active`, { params });
    return response.data.data;
};

export const fetchCategoryByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/categories/${id}?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createCategoryAdmin = async (categoryData: any) => {
    const token = getAdminToken();

    // Check if categoryData is FormData
    if (categoryData instanceof FormData) {
        const response = await axios.post(`${API_URL}/admin/categories`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type for FormData - let axios set it automatically
            }
        });
        return response.data;
    } else {
        // Handle JSON data
        const response = await axios.post(`${API_URL}/admin/categories`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export const updateCategoryAdmin = async (id: string, categoryData: any) => {
    const token = getAdminToken();

    // Check if categoryData is FormData
    if (categoryData instanceof FormData) {
        const response = await axios.put(`${API_URL}/admin/categories/${id}`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Don't set Content-Type for FormData - let axios set it automatically
            }
        });
        return response.data;
    } else {
        // Handle JSON data
        const response = await axios.put(`${API_URL}/admin/categories/${id}`, categoryData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export const deleteCategoryAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleCategoryStatusAdmin = async (id: string, status: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/categories/${id}/status`, { isActive: status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleProductStatusAdmin = async (id: string, status: string) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/products/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchProductsByTempleAdmin = async (templeId: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/products/temple/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.products;
};

// Admin Booking Management
// export const fetchAllBookingsAdmin = async (params?: { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string }) => {
//     const token = getAdminToken();
//     let url = `${API_URL}/admin/bookings`;
//     if (params) {
//         const query = new URLSearchParams();
//         if (params.page !== undefined) query.append('page', params.page.toString());
//         if (params.limit !== undefined) query.append('limit', params.limit.toString());
//         if (params.search) query.append('search', params.search);
//         if (params.status) query.append('status', params.status);
//         if (params.startDate) query.append('startDate', params.startDate);
//         if (params.endDate) query.append('endDate', params.endDate);
//         url += `?${query.toString()}`;
//     }
//     const response = await axios.get(url, {
//         headers: { Authorization: `Bearer ${token}` }
//     });
//     return response.data;
// };

// export const deleteBookingAdmin = async (id: string) => {
//     const token = getAdminToken();
//     const response = await axios.delete(`${API_URL}/admin/bookings/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//     });
//     return response.data;
// };

// Admin Order Management
export const fetchAllOrdersAdmin = async (params?: { page?: number; limit?: number; search?: string; status?: string; paymentStatus?: string; date?: string; templeId?: string }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/orders`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
        if (params.date) query.append('date', params.date);
        if (params.templeId) query.append('templeId', params.templeId);
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSubOrderStatusAdmin = async (subOrderId: string, data: { status: string; shippingLabel?: string }) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/orders/sub-order/${subOrderId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Finance Management
export const fetchWithdrawalRequestsAdmin = async () => {
    const token = getAdminToken();
    const url = `${API_URL}/admin/finance/withdrawals`;
    console.log(`GET: ${url}`);
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateWithdrawalStatusAdmin = async (requestId: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/finance/withdrawals/${requestId}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            // If data is FormData, let axios handle the Content-Type
        }
    });
    return response.data;
};

export const fetchPlatformFinanceSummary = async () => {
    const token = getAdminToken();
    const url = `${API_URL}/admin/finance/platform-summary`;
    console.log(`GET: ${url}`);
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Seller Management
export const fetchAllSellersAdmin = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/sellers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const fetchSellerByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/sellers/${id}`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'lang': 'raw'
        }
    });
    return response.data.data;
};

export const createSellerAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/sellers`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateSellerAdmin = async (id: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/sellers/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteSellerAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/sellers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleSellerStatusAdmin = async (id: string, status: string) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/sellers/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchAllTransactionsAdmin = async (params?: { page?: number, limit?: number, templeId?: string, sellerId?: string }) => {
    const token = getAdminToken();
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.templeId) query.append('templeId', params.templeId);
    if (params?.sellerId) query.append('sellerId', params.sellerId);

    const url = `${API_URL}/admin/finance/transactions?${query.toString()}`;
    console.log(`GET: ${url}`);
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const exportTransactionsExcelAdmin = async (params?: { templeId?: string, sellerId?: string }) => {
    const token = getAdminToken();
    const query = new URLSearchParams();
    if (params?.templeId) query.append('templeId', params.templeId);
    if (params?.sellerId) query.append('sellerId', params.sellerId);

    const response = await axios.get(`${API_URL}/admin/finance/export-excel?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    });
    return response.data;
};

export const fetchAdminDashboardStats = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Commission Slabs Management
export const fetchCommissionSlabsAdmin = async (type?: string, targetId?: string, category?: string, isOffline?: boolean) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/commission-slabs`;
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (targetId) params.append("targetId", targetId);
    if (category) params.append("category", category);
    if (isOffline !== undefined) params.append("isOffline", isOffline.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Global Ratings Management
export const fetchRatingsSettingsAdmin = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/settings/ratings`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateRatingsSettingsAdmin = async (settings: any) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/settings/ratings`, { settings }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


export const createCommissionSlabAdmin = async (slabData: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/commission-slabs`, slabData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateCommissionSlabAdmin = async (id: string, slabData: any) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/commission-slabs/${id}`, slabData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteCommissionSlabAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/commission-slabs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


// Admin Finance Approvals
export const fetchPendingApprovals = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/finance/approvals`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const approveRequestAdmin = async (id: string, type: string) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/finance/approve`, { id, type }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const rejectRequestAdmin = async (id: string, type: string) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/finance/reject`, { id, type }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin User Management
export const fetchAllUsersAdmin = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    dob?: string;
    anniversary?: string;
    dobStart?: string;
    dobEnd?: string;
    anniversaryStart?: string;
    anniversaryEnd?: string;
    filterType?: string;
    includeUnverified?: boolean;
}) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/users`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page !== undefined) query.append('page', params.page.toString());
        if (params.limit !== undefined) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.role) query.append('role', params.role);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.dob) query.append('dob', params.dob);
        if (params.anniversary) query.append('anniversary', params.anniversary);
        if (params.dobStart) query.append('dobStart', params.dobStart);
        if (params.dobEnd) query.append('dobEnd', params.dobEnd);
        if (params.anniversaryStart) query.append('anniversaryStart', params.anniversaryStart);
        if (params.anniversaryEnd) query.append('anniversaryEnd', params.anniversaryEnd);
        if (params.filterType) query.append('filterType', params.filterType);
        if (params.includeUnverified !== undefined) query.append('includeUnverified', params.includeUnverified.toString());
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const downloadUsersExcelAdmin = async (params: any) => {
    const token = getAdminToken();
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) query.append(key, params[key]);
    });

    const response = await axios.get(`${API_URL}/admin/users/export/excel?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    });
    return response;
};

export const downloadUsersAiSensyCSVAdmin = async (params: any) => {
    const token = getAdminToken();
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) query.append(key, params[key]);
    });

    const response = await axios.get(`${API_URL}/admin/users/export/aisensy?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
    });
    return response;
};

export const fetchUserDetailAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleUserStatusAdmin = async (id: string, isActive: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/users/${id}/status`, { isActive }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const bulkToggleUserStatusAdmin = async (ids: string[], isActive: boolean) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/users/bulk/status`, { ids, isActive }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Booking Management

export const fetchAllBookingsAdmin = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    dateType?: string;
    sortBy?: string;
    sortOrder?: string;
    bookingId?: string;
    templeId?: string;
}) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/bookings`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.bookingId) query.append('bookingId', params.bookingId);
        if (params.status && params.status !== 'all') query.append('status', params.status);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.dateType) query.append('dateType', params.dateType);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.templeId && params.templeId !== 'all') query.append('templeId', params.templeId);
        const qs = query.toString();
        if (qs) url += `?${qs}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteBookingAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createOfflineBookingAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/bookings`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const lookupDevoteeByPhoneAdmin = async (phone: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/bookings/devotee-lookup?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchOfflinePoojaLeadsAdmin = async (params?: { search?: string, templeId?: string, page?: number, limit?: number }) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/bookings/offline-leads`;
    if (params) {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.templeId) query.append('templeId', params.templeId);
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        url += `?${query.toString()}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


export const updateBookingStatusAdmin = async (id: string, data: any) => {
    const token = getAdminToken();
    const isFormData = data instanceof FormData;
    const response = await axios.patch(`${API_URL}/admin/bookings/${id}/status`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData && { 'Content-Type': 'multipart/form-data' })
        }
    });
    return response.data;
};

// WhatsApp Marketing & Notifications
export const sendBulkWhatsAppAdmin = async (data: { userIds: string[], campaignName: string, templateParams?: string[] }) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/marketing/send-bulk-whatsapp`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const notifyFailedPayment = async (data: { 
    orderType: 'MARKETPLACE' | 'POOJA' | 'DONATION',
    referenceId?: string,
    orderData?: any,
    userId?: string,
    phone: string, 
    userName?: string,
    error?: any
}) => {
    // This can be called by anyone (devotee) when payment fails
    const response = await axios.post(`${API_URL}/payments/failed`, data);
    return response.data;
};
export const fetchAllDonationsAdmin = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    templeId?: string;
    sortBy?: string;
    sortOrder?: string;
    donationType?: "ALL" | "ONLINE" | "OFFLINE";
    donationSource?: "ALL" | "TEMPLE" | "MANDAL";
}) => {
    const token = getAdminToken();
    let url = `${API_URL}/admin/donations`;
    if (params) {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.templeId && params.templeId !== 'all') query.append('templeId', params.templeId);
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.donationType && params.donationType !== 'ALL') query.append('donationType', params.donationType);
        if (params.donationSource && params.donationSource !== 'ALL') query.append('donationSource', params.donationSource);
        const qs = query.toString();
        if (qs) url += `?${qs}`;
    }
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createDonationAdmin = async (data: any) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/donations`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ==========================================
// MANDAL REGISTRATION ADMIN ENDPOINTS
// ==========================================
export const updateMandalRegistrationStatusAdmin = async (enabled: boolean) => {
    const token = getAdminToken();
    try {
        const response = await axios.patch(
            `${API_URL}/admin/settings/mandal-registration`,
            { enabled },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error: any) {
        console.error("Error updating mandal registration status:", error);
        return { success: false, message: error.response?.data?.message || "Failed to update status" };
    }
};

// ==========================================
// MANDAL MANAGEMENT ADMIN ENDPOINTS
// ==========================================

export const fetchAllMandalsAdmin = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isActive?: boolean;
}) => {
    const token = getAdminToken();
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());
    const url = `${API_URL}/admin/mandals?lang=raw${query.toString() ? '&' + query.toString() : ''}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
};

export const fetchMandalByIdAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/mandals/${id}?lang=raw`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createMandalAdmin = async (formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.post(`${API_URL}/admin/mandals`, formData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateMandalAdmin = async (id: string, formData: FormData) => {
    const token = getAdminToken();
    const response = await axios.put(`${API_URL}/admin/mandals/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteMandalAdmin = async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${API_URL}/admin/mandals/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const toggleMandalStatusAdmin = async (
    id: string,
    data: {
        isActive?: boolean;
        status?: string;
        adminNotes?: string;
        slug?: string;
        subdomain?: string;
        urlType?: string;
        commissionSlabs?: any[];
    }
) => {
    const token = getAdminToken();
    const response = await axios.patch(`${API_URL}/admin/mandals/${id}/status`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// Admin Mandal Settings Management
export const fetchMandalRegistrationSettingsAdmin = async () => {
    const token = getAdminToken();
    const response = await axios.get(`${API_URL}/admin/settings/mandal-registration`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateMandalRegistrationSettingsAdmin = async (data: FormData | any) => {
    const token = getAdminToken();
    let headers: any = { Authorization: `Bearer ${token}` };
    if (data instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
    }
    const response = await axios.patch(`${API_URL}/admin/settings/mandal-registration`, data, {
        headers
    });
    return response.data;
};

