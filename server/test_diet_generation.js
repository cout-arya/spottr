// Direct test of the exact API call the server makes
const axios = require('axios');
require('dotenv').config();

async function testDietPlanGeneration() {
    console.log('='.repeat(60));
    console.log('TESTING DIET PLAN LLM GENERATION');
    console.log('='.repeat(60));

    console.log('\n[1] Checking API Key...');
    console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('Key prefix:', process.env.OPENROUTER_API_KEY?.substring(0, 15) + '...');

    const systemPrompt = `You are an expert nutritionist. Create a 1-day Indian diet plan (4 meals).

Output ONLY valid JSON. No markdown. Structure:
{
    "calories": "Total Kcal",
    "protein": "Total Protein",
    "macros": { "carbs": "g", "fats": "g" },
    "meals": [
        { "name": "Breakfast", "food": "Title", "calories": 0, "protein": 0, "suggestion": "Detail" },
        { "name": "Lunch", "food": "Title", "calories": 0, "protein": 0, "suggestion": "Detail" },
        { "name": "Snack", "food": "Title", "calories": 0, "protein": 0, "suggestion": "Detail" },
        { "name": "Dinner", "food": "Title", "calories": 0, "protein": 0, "suggestion": "Detail" }
    ],
    "advice": "One short tip"
}`;

    const userPrompt = `Profile: 25yo Male, 170cm, 70kg.
Diet Type: Non-vegetarian.
Primary Goal: Muscle Gain.
Task: Create a highly personalized 1-day Indian diet plan.`;

    const models = [
        'meta-llama/llama-3.3-70b-instruct:free',
        'mistralai/mistral-small-3.1-24b:free',
        'qwen/qwen3-4b:free'
    ];

    for (const model of models) {
        console.log(`\n[2] Testing model: ${model}`);
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Spottr'
                    }
                }
            );

            console.log(`\n✅ SUCCESS with ${model}!`);
            console.log('\nResponse preview:');
            console.log(response.data.choices[0].message.content.substring(0, 300) + '...');
            console.log('\n🎉 This model works! The diet plan generation should work in the app.');
            break;

        } catch (err) {
            console.log(`\n❌ FAILED with ${model}`);
            console.log('Status:', err.response?.status);
            console.log('Status Text:', err.response?.statusText);

            if (err.response?.data) {
                console.log('Error details:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.log('Error message:', err.message);
            }

            console.log('\nTrying next model...');
        }
    }

    console.log('\n' + '='.repeat(60));
}

testDietPlanGeneration();
