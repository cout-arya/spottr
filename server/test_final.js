// Final test without JSON format constraint
const axios = require('axios');
require('dotenv').config();

async function finalTest() {
    console.log('Testing without response_format constraint...\n');

    const model = 'meta-llama/llama-3.3-70b-instruct:free';

    console.log(`Testing: ${model}\n`);
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Output ONLY valid JSON.' },
                    { role: 'user', content: 'Create a simple JSON object with a "message" field saying "Hello from RAG!"' }
                ],
                temperature: 0.7
                // NO response_format parameter
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Spottr'
                }
            }
        );
        console.log(`✅ SUCCESS!`);
        console.log('Response:', response.data.choices[0].message.content);
        console.log('\n🎉 The RAG system should now work! Try generating a diet plan.');
    } catch (err) {
        console.log(`❌ FAILED: ${err.response?.status} - ${err.response?.statusText || err.message}`);
        if (err.response?.data) {
            console.log('Error details:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

finalTest();
