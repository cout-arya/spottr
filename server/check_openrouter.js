// Quick test to check if OpenRouter account has credits
const axios = require('axios');
require('dotenv').config();

async function checkOpenRouterAccount() {
    console.log('Checking OpenRouter Account Status...\n');

    // Test 1: Check if API key is valid
    console.log('[1] API Key Check');
    console.log('Key exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('Key prefix:', process.env.OPENROUTER_API_KEY?.substring(0, 15) + '...\n');

    // Test 2: Try a simple LLM call
    console.log('[2] Testing LLM Call (Llama 3.3 70B)');
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Spottr'
                }
            }
        );

        console.log('✅ SUCCESS! LLM is working');
        console.log('Response:', response.data.choices[0].message.content);
        console.log('\n✅ Your OpenRouter account is active and has credits!');
        console.log('The diet plan generation should work now.');

    } catch (err) {
        console.log('❌ FAILED');
        console.log('Status:', err.response?.status);
        console.log('Error:', err.response?.data?.error?.message || err.message);

        if (err.response?.status === 402) {
            console.log('\n⚠️  PAYMENT REQUIRED - You need to add credits to your OpenRouter account');
            console.log('Go to: https://openrouter.ai/settings/billing');
            console.log('Add $1-5 to get started (very cheap, ~$0.0005 per diet plan)');
        } else if (err.response?.status === 401) {
            console.log('\n⚠️  INVALID API KEY - Check your OPENROUTER_API_KEY in .env');
        } else if (err.response?.status === 429) {
            console.log('\n⚠️  RATE LIMITED - Wait a few minutes and try again');
        } else {
            console.log('\n⚠️  Unknown error - Check the error details above');
        }
    }
}

checkOpenRouterAccount();
