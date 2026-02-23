import dotenv from 'dotenv';
dotenv.config();

// Import after loading env
import { sendSMS } from './src/services/mobicommService';

async function test() {
    console.log('--- SMS Test Started ---');
    console.log('Checking env variables...');
    console.log('MOBICOMM_SENDER_ID:', process.env.MOBICOMM_SENDER_ID);

    const testNumber = '+919977132450'; // Using user's number for test
    const testMessage = 'Your OTP for DevBhakti login is 123456. Valid for 5 minutes. Do not share this code with anyone. ';

    console.log(`Testing with number: ${testNumber}`);
    const result = await sendSMS(testNumber, testMessage);

    if (result) {
        console.log('✅ Success: API call reached Dovesoft correctly.');
    } else {
        console.log('❌ Failed: Check the log messages above.');
    }
}

test();
