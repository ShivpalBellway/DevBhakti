import { API_URL } from "@/config/apiConfig";

export const fetchMandalBankDetails = async () => {
    try {
        const token = localStorage.getItem('mandal_token') || localStorage.getItem('token');
        const response = await fetch(`${API_URL}/mandal-admin/bank`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    } catch (error: any) {
        console.error("fetchMandalBankDetails error:", error);
        return { success: false, message: error.message };
    }
};

export const updateMandalBankDetails = async (bankDetails: any) => {
    try {
        const token = localStorage.getItem('mandal_token') || localStorage.getItem('token');
        const response = await fetch(`${API_URL}/mandal-admin/bank`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bankDetails)
        });
        return await response.json();
    } catch (error: any) {
        console.error("updateMandalBankDetails error:", error);
        return { success: false, message: error.message };
    }
};
