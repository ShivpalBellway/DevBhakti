import { API_URL } from "@/config/apiConfig";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const fetchBankDetails = async () => {
    try {
        const response = await fetch(`${API_URL}/temple-admin/bank`, {
            headers: getAuthHeaders(),
        });
        const data = await response.json();
        return data; // Expected { success: true, data: { ... } }
    } catch (error) {
        console.error('Fetch Bank Details Error:', error);
        return { success: false, message: 'Failed to fetch bank details' };
    }
};

export const updateBankDetails = async (bankDetails: any) => {
    try {
        const response = await fetch(`${API_URL}/temple-admin/bank`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(bankDetails),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Update Bank Details Error:', error);
        return { success: false, message: 'Failed to update bank details' };
    }
};
