const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Explicitly load .env from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('ai_test_output.txt', (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
};

// Clear previous log
fs.writeFileSync('ai_test_output.txt', '');

log('--- AI Connection Diagnostic (Attempt 2) ---');
log('Current Directory: ' + __dirname);
log('API Key Present: ' + !!process.env.OPENROUTER_API_KEY);
if (process.env.OPENROUTER_API_KEY) {
    log('API Key Length: ' + process.env.OPENROUTER_API_KEY.length);
    log('API Key Start: ' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');
}

const testAI = async () => {
    try {
        log('\nAttempting to connect to OpenRouter...');
        // Using a different model to check if it's model-specific
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [{ role: 'user', content: 'Test' }],
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'TinderGymBuddies Test'
                }
            }
        );
        log('✅ Connection Successful!');
        log('Status: ' + response.status);
        log('Response: ' + JSON.stringify(response.data.choices[0].message.content));
    } catch (error) {
        log('❌ Connection Failed!');
        if (error.response) {
            log('Status: ' + error.response.status);
            log('Data: ' + JSON.stringify(error.response.data, null, 2));
        } else {
            log('Error: ' + error.message);
        }
    }
};

testAI();
