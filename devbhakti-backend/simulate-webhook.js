const axios = require('axios');

/**
 * SIMULATE SHIPROCKET WEBHOOK
 * Use this script to test if the automatic status sync is working correctly.
 * 
 * Instructions:
 * 1. Open a new terminal in the backend directory.
 * 2. Run: node simulate-webhook.js
 */

async function simulateWebhook() {
    // 1. Replace this with a real shiprocketOrderId from your database
    // You can find this in any SubOrder record in your DB.
    const TEST_SHIPROCKET_ORDER_ID = "1201014463";

    // 2. The status you want to test (e.g., 'picked up', 'out for delivery', 'delivered')
    const TEST_STATUS = "out for delivery";

    const payload = {
        order_id: TEST_SHIPROCKET_ORDER_ID,
        status: TEST_STATUS,
        awb: "AWB123456789",
        tracking_url: "https://shiprocket.co/tracking/AWB123456789",
        courier_name: "Delhivery"
    };

    console.log(`🚀 Simulating Shiprocket Webhook: ${TEST_STATUS}...`);

    try {
        const response = await axios.post('http://localhost:5000/api/shiprocket-webhook/tracking', payload);
        console.log("✅ Webhook Response:", response.data);
        console.log("\nNext Steps:");
        console.log("1. Check your Admin Panel to see the updated status.");
        console.log("2. Check the Database 'SubOrder' and 'Order' tables.");
        if (TEST_STATUS.toLowerCase() === 'delivered') {
            console.log("3. Check the 'TempleLedger' table to see if earnings are marked COMPLETED.");
        }
    } catch (error) {
        console.error("❌ Error simulating webhook:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

simulateWebhook();
