import axios from 'axios';

// Configuration from environment variables
const MOBICOMM_KEY = process.env.MOBICOMM_KEY;
const MOBICOMM_SENDER_ID = process.env.MOBICOMM_SENDER_ID;
// Updated API URL based on user's dashboard
const MOBICOMM_URL = 'https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx';

/**
 * Sends an SMS to the specified phone number using Mobicomm SMS Template API.
 * @param phone The phone number to send the SMS to (format: 919876543210)
 * @param message The message content
 * @returns Promise<boolean> true if successful, false otherwise
 */
export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
    // 1. Check if credentials exist
    if (!MOBICOMM_KEY || !MOBICOMM_SENDER_ID) {
        console.warn('[Mobicomm] Missing credentials in .env. Skipping SMS send.');
        return false;
    }

    try {
        // 2. Format phone number - strip '+' if present
        let formattedPhone = phone;
        if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }

        // 3. Prepare request body based on SMS Template API format
        const requestBody = {
            SenderId: MOBICOMM_SENDER_ID,
            Message: message,
            MobileNumbers: formattedPhone,
            ApiKey: MOBICOMM_KEY,
            ClientId: "0" // Default value as shown in API docs
        };

        console.log(`[Mobicomm] Sending SMS to ${formattedPhone}...`);

        // 4. Make POST API call with key in header
        const response = await axios.post(MOBICOMM_URL, requestBody, {
            headers: {
                'key': MOBICOMM_KEY,
                'Content-Type': 'application/json'
            }
        });

        // 5. Handle Response
        const responseData = response.data;
        console.log(`[Mobicomm] Response:`, responseData);

        if (response.status === 200) {
            // Check response for success/error status
            const responseStr = String(responseData).toLowerCase();

            // Check for common error keywords
            if (responseStr.includes('error') || responseStr.includes('fail') || responseStr.includes('invalid')) {
                console.error('[Mobicomm] API returned error:', responseData);
                return false;
            }

            // Check for success indicators
            if (responseStr.includes('success') || responseData?.status === 'success') {
                console.log('[Mobicomm] SMS sent successfully');
                return true;
            }

            // If response doesn't explicitly indicate error, consider it successful
            console.log('[Mobicomm] SMS sent (response received)');
            return true;
        } else {
            console.error(`[Mobicomm] HTTP Error: ${response.status}`);
            return false;
        }

    } catch (error: any) {
        console.error('[Mobicomm] Request failed:', error.message);
        if (error.response) {
            console.error('[Mobicomm] Error data:', error.response.data);
            console.error('[Mobicomm] Error status:', error.response.status);
        }
        return false;
    }
};
