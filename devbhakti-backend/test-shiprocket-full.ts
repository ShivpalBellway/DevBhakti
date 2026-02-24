import { authenticateShiprocket, createShiprocketPickupLocation } from './src/services/shiprocketService';

async function testPhoneFormat() {
    try {
        await authenticateShiprocket();
        const pickupData = {
            pickup_location: `TEST_PHONE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            name: "Test Phone Plus",
            email: "test_plus@devbhakti.in",
            phone: "+919876543210", // Testing with normalized phone
            address: "123 Test Street",
            city: "Delhi",
            state: "Delhi",
            country: "India",
            pin_code: "110001"
        };
        const pickupRes = await createShiprocketPickupLocation(pickupData);
        console.log("Response:", JSON.stringify(pickupRes, null, 2));
    } catch (error: any) {
        console.error("Test Failed!", error.message);
    }
}
testPhoneFormat();
