const axios = require('axios');
const User = require('../models/User');

const generateDietPlan = async (req, res) => {
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('Missing OPENROUTER_API_KEY');
            return res.status(500).json({ message: 'Server Configuration Error: API Key Missing' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = user.profile || {};
        const { age, gender, height, weight, dietaryPreference, goals, fitnessLevel } = profile;

        // Construct Prompts
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

        const userPrompt = `Profile: ${age || 25}yo ${gender || 'Male'}, ${height || 170}cm, ${weight || 70}kg.
        Diet Type: ${dietaryPreference || 'Non-vegetarian'}.
        Primary Goal: ${(goals || []).join(', ') || 'General Fitness'}.
        Gym Type: ${profile.gymType || 'Commercial Gym'}.
        Experience: ${profile.experienceYears || 0} years (${profile.fitnessLevel || 'Beginner'}).
        Commitment: ${profile.commitment || 'Casual'} user.
        Lifestyle: Smoker(${profile.lifestyle?.smoker || 'No'}), Alcohol(${profile.lifestyle?.alcohol || 'None'}), Sleep(${profile.lifestyle?.sleep || 'Irregular'}).
        
        Task: Create a highly personalized 1-day Indian diet plan effectively targeting the Primary Goal.
        Ensure protein intake matches the goal (e.g., High for Muscle Gain).`;

        // Helper to call AI with retry/fallback
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const attemptGeneration = async (model, retries = 1) => {
            try {
                console.log(`[AI] Attempting generation with ${model}...`);
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7,
                        response_format: { type: 'json_object' }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            'HTTP-Referer': 'http://localhost:3000',
                            'X-Title': 'TinderGymBuddies'
                        }
                    }
                );
                console.log(`[AI] Response received from ${model}. Status: ${response.status}`);
                return response.data.choices[0].message.content;
            } catch (error) {
                console.error(`[AI] Error with ${model}:`, error.message);
                if (error.response) {
                    console.error(`[AI] API Error Data:`, JSON.stringify(error.response.data, null, 2));
                }
                if (retries > 0) {
                    console.log(`[AI] Retrying ${model} in 2s...`);
                    await sleep(2000);
                    return attemptGeneration(model, retries - 1);
                }
                throw error;
            }
        };

        let content;
        try {
            console.log('[AI] Starting generation pipeline...');
            // Try Primary Model (Google Gemini - fast/free)
            content = await attemptGeneration('google/gemini-2.0-flash-exp:free');
        } catch (e) {
            console.error('[AI] Primary model failed, trying fallback...');
            // Fallback Model (Mistral 7B - reliable/free)
            try {
                content = await attemptGeneration('mistralai/mistral-7b-instruct:free');
            } catch (e2) {
                console.error('[AI] All models failed.');
                throw new Error('All AI models failed to respond.');
            }
        }

        console.log('[AI] Raw Content received:', content);

        // Robust JSON Parsing
        let dietPlan;
        try {
            // 1. Try direct parse
            dietPlan = JSON.parse(content);
            console.log('[AI] JSON parsed successfully.');
        } catch (e) {
            console.warn('[AI] Direct JSON parse failed, attempting cleanup...');
            // 2. Try stripping markdown
            try {
                const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
                dietPlan = JSON.parse(clean);
                console.log('[AI] Cleaned JSON parsed successfully.');
            } catch (e2) {
                console.warn('[AI] Cleanup failed, attempting substring extraction...');
                // 3. Try finding first { and last }
                const first = content.indexOf('{');
                const last = content.lastIndexOf('}');
                if (first !== -1 && last !== -1) {
                    const jsonSub = content.substring(first, last + 1);
                    dietPlan = JSON.parse(jsonSub);
                    console.log('[AI] Substring extraction parsed successfully.');
                } else {
                    console.error('[AI] Fatal: Could not parse JSON.');
                    throw new Error('Could not parse JSON from AI response');
                }
            }
        }

        res.json(dietPlan);

    } catch (error) {
        console.error('Final AI Controller Error:', error.message);
        res.status(500).json({
            message: 'AI Service Error. Please try again in 5 seconds.',
            details: error.message
        });
    }
};

module.exports = { generateDietPlan };
