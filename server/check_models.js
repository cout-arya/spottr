const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    try {
        const listResponse = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [{ role: 'user', content: 'hello' }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });
        console.log('RESPONSE:', response.data.choices[0].message.content);
    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) console.log(e.response.data);
    }
};

test();
