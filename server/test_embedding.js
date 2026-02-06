// Test OpenRouter Embedding API
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENROUTER_API_KEY;

async function testEmbedding() {
    console.log('Testing OpenRouter Embedding API...');
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key prefix:', API_KEY?.substring(0, 10) + '...');

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/embeddings',
            {
                model: 'openai/text-embedding-3-small',
                input: 'test muscle gain nutrition'
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Spottr'
                }
            }
        );

        console.log('✅ SUCCESS!');
        console.log('Embedding length:', response.data.data[0].embedding.length);
        console.log('Model used:', response.data.model);
    } catch (error) {
        console.error('❌ ERROR:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testEmbedding();
