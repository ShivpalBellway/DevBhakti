import dotenv from 'dotenv';
dotenv.config();

// Import after loading env
import { sendSMS } from './src/services/mobicommService';

async function test() {
    console.log('--- SMS Test Started ---');
    console.log('Checking env variables...');
    console.log('MOBICOMM_SENDER_ID:', process.env.MOBICOMM_SENDER_ID);

    // Change this to your actual number to test receipt
    const testNumber = '+919879879879';
    const testMessage = 'Your OTP for DevBhakti is 123456. Valid for 10 minutes.';

    console.log(`Testing with number: ${testNumber}`);
    const result = await sendSMS(testNumber, testMessage);

    if (result) {
        console.log('✅ Success: API call reached Dovesoft correctly.');
    } else {
        console.log('❌ Failed: Check the log messages above.');
    }
}

test();
