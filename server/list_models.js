const axios = require('axios');
require('dotenv').config();

async function listModels() {
    try {
        const response = await axios.get('https://openrouter.ai/api/v1/models');
        const models = response.data.data;

        console.log('Available FREE models:');
        models.forEach(m => {
            if (m.id.includes(':free')) {
                console.log(`- ${m.id}`);
            }
        });

        console.log('\nChecking our target models:');
        const targets = [
            'google/gemini-2.0-flash-lite-preview-02-05:free',
            'qwen/qwen-2.5-7b-instruct:free',
            'meta-llama/llama-3.3-70b-instruct:free'
        ];

        targets.forEach(t => {
            const found = models.find(m => m.id === t);
            console.log(`${t}: ${found ? 'AVAILABLE' : 'NOT FOUND'}`);
        });

    } catch (error) {
        console.error('Error fetching models:', error.message);
    }
}

listModels();
