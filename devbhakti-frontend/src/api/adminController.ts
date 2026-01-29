import axios from "axios";
import { API_URL } from "@/config/apiConfig";

// Admin Auth
export const loginAdmin = async (credentials: any) => {
    const response = await axios.post(`${API_URL}/admin/auth/login`, credentials);
    return response.data;
};

// Admin Temple Management
// (Consolidated below)

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

// Admin Event Management
export const fetchAllEventsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchEventsByTemple = async (templeId: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/events/temple/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const createEventAdmin = async (data: any) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/events`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateEventAdmin = async (id: string, data: any) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/events/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteEventAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
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

export const createTempleAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/temples`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateTempleAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/temples/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteTempleAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/temples/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleTempleStatusAdmin = async (id: string, isVerified: boolean, liveStatus: boolean) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.patch(`${API_URL}/admin/temples/${id}/status`, { isVerified, liveStatus }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchTempleUpdateRequests = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/temples/update-requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const approveTempleUpdate = async (requestId: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/temples/update-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const rejectTempleUpdate = async (requestId: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/temples/update-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin CMS Management
export const fetchAllBannersAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/cms/banners`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createBannerAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/cms/banners`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateBannerAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/cms/banners/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteBannerAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/cms/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchAllFeaturesAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/cms/features`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createFeatureAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/cms/features`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateFeatureAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/cms/features/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteFeatureAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/cms/features/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};


export const fetchAllTestimonialsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/cms/testimonials`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createTestimonialAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/cms/testimonials`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateTestimonialAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/cms/testimonials/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteTestimonialAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/cms/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// CTA Cards Management
export const fetchAllCTACardsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/cms/cta-cards`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createCTACardAdmin = async (formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.post(`${API_URL}/admin/cms/cta-cards`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updateCTACardAdmin = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.put(`${API_URL}/admin/cms/cta-cards/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteCTACardAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/cms/cta-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Admin Product Management
export const fetchAllProductsAdmin = async () => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.products;
};

export const fetchProductByIdAdmin = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const createProductAdmin = async (productData: any) => {
    const token = localStorage.getItem("admin_token");
    
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
    const token = localStorage.getItem("admin_token");
    
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
    const token = localStorage.getItem("admin_token");
    const response = await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const toggleProductStatusAdmin = async (id: string, status: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.patch(`${API_URL}/admin/products/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const fetchProductsByTempleAdmin = async (templeId: string) => {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${API_URL}/admin/products/temple/${templeId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data.products;
};
