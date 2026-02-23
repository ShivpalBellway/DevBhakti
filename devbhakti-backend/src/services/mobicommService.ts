import axios from 'axios';

// Configuration from environment variables
const MOBICOMM_USER = process.env.MOBICOMM_USER;
const MOBICOMM_PASSWORD = process.env.MOBICOMM_PASSWORD;
const MOBICOMM_API_KEY = process.env.MOBICOMM_API_KEY;
const MOBICOMM_SENDER_ID = process.env.MOBICOMM_SENDER_ID;
const MOBICOMM_ENTITY_ID = process.env.MOBICOMM_ENTITY_ID; // PE Id
const MOBICOMM_TEMPLATE_ID = process.env.MOBICOMM_TEMPLATE_ID; // Template Id

// Dovesoft API URL 
const MOBICOMM_URL = 'https://api.dovesoft.io/api/sendsms';


/**
 * Sends an SMS using Dovesoft API (Mobicomm)
 * @param phone The phone number to send the SMS to (format: +91XXXXXXXXXX)
 * @param message The message content
 * @param templateId Optional template ID
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const sendSMS = async (phone: string, message: string, templateId?: string): Promise<boolean> => {
    // 1. Check if credentials exist
    if (!MOBICOMM_API_KEY && (!MOBICOMM_USER || !MOBICOMM_PASSWORD)) {
        console.warn('[Mobicomm] Missing credentials (API Key or User/Pass) in .env. Skipping SMS send.');
        return false;
    }

    if (!MOBICOMM_SENDER_ID) {
        console.warn('[Mobicomm] Missing Sender ID in .env. Skipping SMS send.');
        return false;
    }

    try {
        // 2. Format phone number - ensure it has the correct format
        // Many Indian gateways prefer 91XXXXXXXXXX without the '+'
        let formattedPhone = phone.replace(/\+/g, '').trim();

        // 3. Prepare query parameters for Dovesoft HTTP API
        const params: any = {
            mobiles: formattedPhone,
            sms: message,
            senderid: MOBICOMM_SENDER_ID,
            entityid: MOBICOMM_ENTITY_ID,
            tempid: templateId || MOBICOMM_TEMPLATE_ID,
        };

        // Add authentication
        if (MOBICOMM_API_KEY) {
            params.key = MOBICOMM_API_KEY;
        } else {
            params.user = MOBICOMM_USER;
            params.password = MOBICOMM_PASSWORD;
        }

        console.log(`[Mobicomm] Sending SMS via Dovesoft...`);
        console.log(`[Mobicomm] Destination: ${formattedPhone}`);
        console.log(`[Mobicomm] Message Length: ${message.length} chars`);
        console.log(`[Mobicomm] Message Content: "${message}"`);
        console.log(`[Mobicomm] Template ID: ${params.tempid}`);
        console.log(`[Mobicomm] Entity ID: ${params.entityid}`);

        // 4. Make API call
        // Some gateways return empty on HTTPS if not configured, try HTTP as well
        const urls = [
            'https://api.dovesoft.io/api/sendsms',
            'http://api.dovesoft.io/api/sendsms'
        ];

        let response;
        let finalUrl = '';

        for (const url of urls) {
            console.log(`[Mobicomm] Trying ${url}...`);
            try {
                const res = await axios.get(url, { params, timeout: 15000 });
                if (res.data && res.data !== '' && res.data !== '""') {
                    response = res;
                    finalUrl = url;
                    break;
                }
                console.log(`[Mobicomm] ${url} returned empty response.`);
                // Keep trying or use the last one if both are empty
                response = res;
                finalUrl = url;
            } catch (err: any) {
                console.error(`[Mobicomm] Error with ${url}:`, err.message);
                if (!response) response = { status: 500, data: null }; // Fallback
            }
        }

        // 5. Handle Response
        let responseData = response?.data;
        console.log(`[Mobicomm] Final URL used: ${finalUrl}`);
        console.log(`[Mobicomm] Response StatusCode: ${response?.status}`);
        console.log(`[Mobicomm] Response Headers:`, JSON.stringify(response?.headers || {}));
        console.log(`[Mobicomm] Response Raw:`, responseData);

        if (response && response.status === 200) {
            const responseStr = typeof responseData === 'object'
                ? JSON.stringify(responseData).toLowerCase()
                : String(responseData).toLowerCase();

            // Success often returns a number (message ID) like "1001-3453" or "OK"
            // Empty string "" typically means rejection by the gateway due to DLT mismatch or missing parameters.
            if (responseStr === '' || responseStr === '""' || responseStr === 'null' || responseStr.trim() === '') {
                console.warn('[Mobicomm] API returned an empty response. Rejection likely.');
                return false;
            }

            if (responseStr.includes('error') || responseStr.includes('fail') || responseStr.includes('invalid')) {
                console.error('[Mobicomm] API returned error:', responseData);
                return false;
            }

            return true;
        } else {
            console.error(`[Mobicomm] HTTP Error: ${response?.status || 'Unknown'}`);
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
