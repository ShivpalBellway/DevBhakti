import dotenv from 'dotenv';
dotenv.config();

const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiryBy: number | null = null;

export const authenticateShiprocket = async () => {
    // Return cached token if not expired (tokens usually last 10 days)
    if (cachedToken && tokenExpiryBy && Date.now() < tokenExpiryBy) {
        return cachedToken;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error('SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not configured in .env');
    }

    try {
        const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data: any = await response.json();

        if (data.token) {
            cachedToken = data.token;
            // Cache for 9 days to be safe
            tokenExpiryBy = Date.now() + 9 * 24 * 60 * 60 * 1000;
            return cachedToken;
        } else {
            throw new Error(data.message || 'Shiprocket authentication failed');
        }
    } catch (error: any) {
        console.error('Shiprocket Auth Error:', error.message);
        throw error;
    }
};

export const createShiprocketOrder = async (orderData: any) => {
    try {
        const token = await authenticateShiprocket();

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData),
        });

        const data: any = await response.json();
        return data;
    } catch (error: any) {
        console.error('Shiprocket Create Order Error:', error.message);
        throw error;
    }
};

export const getShiprocketTracking = async (awbCode: string) => {
    try {
        const token = await authenticateShiprocket();
        const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/awb/${awbCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Shiprocket Tracking Error:', error.message);
        throw error;
    }
};

export const createShiprocketPickupLocation = async (pickupData: any) => {
    try {
        const token = await authenticateShiprocket();
        const response = await fetch(`${SHIPROCKET_API_URL}/settings/company/addpickup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pickupData),
        });

        const data: any = await response.json();
        return data;
    } catch (error: any) {
        console.error('Shiprocket Create Pickup Location Error:', error.message);
        throw error;
    }
};
export const checkShiprocketServiceability = async (pickupPincode: string, deliveryPincode: string, weight: number = 0.5, cod: number = 0) => {
    try {
        const token = await authenticateShiprocket();
        const url = new URL(`${SHIPROCKET_API_URL}/courier/serviceability`);
        url.searchParams.append('pickup_postcode', pickupPincode);
        url.searchParams.append('delivery_postcode', deliveryPincode);
        url.searchParams.append('weight', weight.toString());
        url.searchParams.append('cod', cod.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data: any = await response.json();
        return data;
    } catch (error: any) {
        console.error('Shiprocket Serviceability Error:', error.message);
        throw error;
    }
};
