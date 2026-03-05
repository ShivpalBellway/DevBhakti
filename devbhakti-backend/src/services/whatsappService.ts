import axios from 'axios';

/**
 * Sends a WhatsApp message using the AiSensy API.
 * 
 * @param phone - The destination phone number (e.g., "+91XXXXXXXXXX")
 * @param userName - The recipient's name (used for personalized templates)
 * @param campaignName - The name of the campaign in AiSensy
 * @param params - An array of parameters to fill in the template (e.g., ["John", "Monday"])
 * @returns - The response data from AiSensy
 */
export const sendWhatsAppMessage = async (
    phone: string,
    userName: string,
    campaignName: string,
    params: string[]
) => {
    const AISENSY_API_KEY = process.env.AISENSY_API_KEY;

    if (!AISENSY_API_KEY) {
        console.warn('[AiSensy] AISENSY_API_KEY is missing in .env. Skipping WhatsApp send.');
        return null;
    }

    const payload = {
        apiKey: AISENSY_API_KEY,
        campaignName: campaignName,
        destination: phone,
        userName: userName,
        templateParams: params,
        source: "DevBhakti_Admin"
    };

    try {
        console.log(`[AiSensy] Sending WhatsApp message to ${phone} for campaign "${campaignName}"...`);
        const response = await axios.post('https://backend.aisensy.com/campaign/t1/api/v2', payload);
        return response.data;
    } catch (error: any) {
        console.error("[AiSensy] WhatsApp Send Error:", error.response?.data || error.message);
        throw error;
    }
};
