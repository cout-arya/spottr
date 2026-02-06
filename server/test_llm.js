// Simple test to verify the exact error
const axios = require('axios');
require('dotenv').config();

async function testLLM() {
    console.log('Testing LLM with correct free model...\n');

    const models = [
        'google/gemini-2.0-flash-exp:free',
        'openrouter/free',
        'google/gemini-2.5-pro-exp-03-25:free'
    ];

    for (const model of models) {
        console.log(`\nTrying: ${model}`);
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: 'Say "Hello" in JSON format with a message field.' }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Spottr'
                    }
                }
            );
            console.log(`✅ SUCCESS with ${model}`);
            console.log('Response:', response.data.choices[0].message.content);
            break;
        } catch (err) {
            console.log(`❌ FAILED: ${err.response?.status} - ${err.response?.statusText}`);
            if (err.response?.data) {
                console.log('Error details:', JSON.stringify(err.response.data, null, 2));
            }
        }
    }
}

testLLM();
