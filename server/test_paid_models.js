// Test if models work WITHOUT :free suffix (might need credits)
const axios = require('axios');
require('dotenv').config();

async function testWithoutFreeSuffix() {
    console.log('Testing models WITHOUT :free suffix...\n');

    // These might work if you have credits
    const models = [
        'meta-llama/llama-3.3-70b-instruct',  // No :free
        'qwen/qwen-2.5-7b-instruct',          // Different model
        'google/gemini-flash-1.5-8b'          // Gemini Flash
    ];

    for (const model of models) {
        console.log(`\nTrying: ${model}`);
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'user', content: 'Say "Hello" in JSON with a message field.' }
                    ]
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
            console.log(`\n🎉 Use this model: ${model}`);
            break;
        } catch (err) {
            console.log(`❌ ${err.response?.status}: ${err.response?.data?.error?.message || err.message}`);
        }
    }
}

testWithoutFreeSuffix();
