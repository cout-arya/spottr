const axios = require('axios');
require('dotenv').config();

const test = async () => {
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models');
        const free = response.data.data.filter(m => m.id.includes(':free') || (m.pricing && parseFloat(m.pricing.prompt) === 0));

        console.log('--- ALL FREE MODELS ---');
        console.log(free.map(m => m.id).join('\n'));

        console.log('\n--- TESTING RECOMMENDED ONES ---');
        const candidates = ['mistralai/mistral-7b-instruct:free', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-3-12b-it:free'];

        for (const model of candidates) {
            try {
                console.log(`Testing ${model}...`);
                const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: model,
                    messages: [{ role: 'user', content: 'Say OK' }]
                }, {
                    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
                });
                console.log(`  PASSED: ${res.data.choices[0].message.content}`);
            } catch (e) {
                console.log(`  FAILED: ${e.message}`);
            }
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    }
};

test();
