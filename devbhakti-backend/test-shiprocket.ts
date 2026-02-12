import { authenticateShiprocket } from './src/services/shiprocketService';

async function testConnection() {
    console.log("Testing Shiprocket Connection...");
    try {
        const token = await authenticateShiprocket();
        if (!token) {
            throw new Error("Token not received from Shiprocket");
        }
        console.log("✅ Connection Successful!");
        console.log("Token received:", token.substring(0, 10) + "...");
    } catch (error: any) {
        console.error("❌ Connection Failed!");
        console.error(error.message || error);
        console.log("\nPlease check your .env file and ensure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are correct.");
    }
}

testConnection();
