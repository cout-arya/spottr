// Test the updated working models
const axios = require('axios');
require('dotenv').config();

async function testWorkingModels() {
    console.log('Testing CONFIRMED working free models (Feb 2026)...\n');

    const models = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen-2.5-7b-instruct:free'
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
                        { role: 'user', content: 'Say "Hello from RAG system!" in JSON format with a message field.' }
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
            console.log('\n🎉 This model works! The RAG system should now function properly.');
            break;
        } catch (err) {
            console.log(`❌ FAILED: ${err.response?.status} - ${err.response?.statusText || err.message}`);
            if (err.response?.data?.error) {
                console.log('Error:', err.response.data.error.message);
            }
        }
    }
}

testWorkingModels();
