import axios from 'axios';

// Configuration from environment variables
const MOBICOMM_KEY = process.env.MOBICOMM_KEY;
const MOBICOMM_SENDER_ID = process.env.MOBICOMM_SENDER_ID;
const MOBICOMM_ENTITY_ID = process.env.MOBICOMM_ENTITY_ID; // PE Id
const MOBICOMM_TEMPLATE_ID = process.env.MOBICOMM_TEMPLATE_ID; // Template Id

// Updated API URL for Dovesoft
const MOBICOMM_URL = 'https://api.dovesoft.io//api/sendsms';


/**
 * Sends an SMS using Dovesoft API (Mobicomm)
 * @param phone The phone number to send the SMS to (format: +91XXXXXXXXXX)
 * @param message The message content
 * @param templateId Optional template ID
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const sendSMS = async (phone: string, message: string, templateId?: string): Promise<boolean> => {
    // 1. Check if credentials exist
    if (!MOBICOMM_KEY || !MOBICOMM_SENDER_ID) {
        console.warn('[Mobicomm] Missing credentials in .env. Skipping SMS send.');
        return false;
    }

    try {
        // 2. Format phone number - ensure it has the correct format
        let formattedPhone = phone;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
        }

        // 3. Prepare query parameters as per the new API link
        const params: any = {
            key: MOBICOMM_KEY,
            mobiles: formattedPhone,
            sms: message,
            senderid: MOBICOMM_SENDER_ID,
            entityid: MOBICOMM_ENTITY_ID,
            tempid: templateId || MOBICOMM_TEMPLATE_ID
        };

        console.log(`[Mobicomm] Sending SMS via Dovesoft to ${formattedPhone}...`);

        // 4. Make GET API call (usually these APIs are GET based on the link provided)
        const response = await axios.get(MOBICOMM_URL, { params });

        // 5. Handle Response
        const responseData = response.data;
        console.log(`[Mobicomm] Response:`, responseData);

        // Dovesoft responses are often strings like "Submitted Successfully" or JSON
        if (response.status === 200) {
            const responseStr = JSON.stringify(responseData).toLowerCase();

            if (responseStr.includes('error') || responseStr.includes('fail') || responseStr.includes('invalid')) {
                console.error('[Mobicomm] API returned error:', responseData);
                return false;
            }

            return true;
        } else {
            console.error(`[Mobicomm] HTTP Error: ${response.status}`);
            return false;
        }

    } catch (error: any) {
        console.error('[Mobicomm] Request failed:', error.message);
        if (error.response) {
            console.error('[Mobicomm] Error data:', error.response.data);
        }
        return false;
    }
};

