const asyncHandler = require('express-async-handler');
const axios = require('axios');
const User = require('../models/User');
const vectorStore = require('../utils/vectorStore');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Gemini API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Unified Helper for Gemini AI calls
 * Converts OpenAI-style messages to Gemini format and calls generateContent
 */
const attemptGeneration = async (model, messages, retries = 1) => {
    const apiKey = process.env.gemini_key;
    if (!apiKey) throw new Error('gemini_key not configured');

    try {
        console.log(`[AI] Attempting generation with Gemini ${model}...`);

        // Convert OpenAI-style messages to Gemini format
        // System message becomes systemInstruction, user/assistant become contents
        let systemInstruction = undefined;
        const contents = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = { parts: [{ text: msg.content }] };
            } else {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        };

        if (systemInstruction) {
            requestBody.systemInstruction = systemInstruction;
        }

        const response = await axios.post(
            `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
            requestBody,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const candidate = response.data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('Empty response from Gemini');
        }

        console.log(`[AI] Response received from Gemini ${model}.`);
        return candidate.content.parts[0].text;
    } catch (error) {
        console.error(`[AI] Error with Gemini ${model}:`, error.response?.data?.error?.message || error.message);
        if (retries > 0) {
            await sleep(2000);
            return attemptGeneration(model, messages, retries - 1);
        }
        throw error;
    }
};

const generateDietPlan = async (req, res) => {
    try {
        if (!process.env.gemini_key) {
            return res.status(500).json({ message: 'Server Configuration Error: Gemini API Key Missing' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const profile = user.profile || {};
        const { age, gender, height, weight, dietaryPreference, goals } = profile;

        // RAG Logic
        const primaryGoal = (goals || [])[0] || 'General Fitness';
        const nutritionQuery = `${primaryGoal} nutrition for ${gender || 'Male'} ${weight || 70}kg ${dietaryPreference || 'Non-vegetarian'}`;
        let retrievedContext = '';
        try {
            const relevantDocs = await vectorStore.retrieveContext(nutritionQuery, 3);
            if (relevantDocs.length > 0) {
                retrievedContext = vectorStore.formatContextForPrompt(relevantDocs);
            }
        } catch (ragError) {
            console.warn('[RAG] Context retrieval failed:', ragError.message);
        }

        const systemPrompt = `You are an expert nutritionist. Create a 1-day Indian diet plan (4 meals).
${retrievedContext ? `IMPORTANT: Use verified guidelines:\n${retrievedContext}\n` : ''}
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
        Primary Goal: ${primaryGoal}.
        Create a personalized 1-day Indian diet plan.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        let content;
        try {
            content = await attemptGeneration('gemini-2.0-flash', messages, 1);
        } catch (e) {
            console.warn('[AI] Gemini Flash failed, trying Flash-Lite...');
            try {
                content = await attemptGeneration('gemini-2.0-flash-lite', messages, 1);
            } catch (e2) {
                console.warn('[AI] Flash-Lite failed, trying Gemini 1.5 Flash...');
                try {
                    content = await attemptGeneration('gemini-1.5-flash', messages, 1);
                } catch (e3) {
                    console.error('[AI] All Gemini models failed in Generate Diet');
                }
            }
        }

        let dietPlan = null;
        if (content) {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
                try {
                    dietPlan = JSON.parse(clean.substring(first, last + 1));
                } catch (jsonError) {
                    console.error('[AI] JSON Parse Error:', jsonError.message);
                }
            }
        }

        if (!dietPlan) {
            dietPlan = {
                calories: 2200,
                protein: 140,
                macros: { carbs: 200, fats: 60 },
                meals: [
                    { name: "Breakfast", food: "Oats & Whey", calories: 400, protein: 30, suggestion: "Add berries" },
                    { name: "Lunch", food: "Chicken Rice", calories: 700, protein: 50, suggestion: "Add veggies" },
                    { name: "Snack", food: "Greek Yogurt", calories: 200, protein: 20, suggestion: "High protein" },
                    { name: "Dinner", food: "Salmon & Asparagus", calories: 600, protein: 40, suggestion: "Light dinner" }
                ],
                advice: "Stay consistent with protein! (AI Service Unavailable)"
            };
        }

        // Save to DB
        try {
            if (!user.plans) user.plans = {};
            user.plans.diet = dietPlan;
            await user.save();
        } catch (dbError) {
            console.error('[AI] Failed to save plan:', dbError.message);
        }

        res.json(dietPlan);

    } catch (error) {
        console.error('Generate Diet Error:', error.message);
        res.json({
            calories: 2000,
            protein: 100,
            meals: [],
            advice: "Service Temporary Unavailable"
        });
    }
};

const analyzeLog = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });

        const systemPrompt = `Analyze user log. Return ONLY valid JSON: { "type": "meal" or "workout", "summary": "Short title", "xp": <integer between 10 and 50 based on effort>, "data": { "details": "context" } }`;
        const userPrompt = `Log: "${text}"`;

        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];

        let content;
        try {
            content = await attemptGeneration('gemini-2.0-flash-lite', messages, 1);
        } catch (e) {
            console.warn('[AI] Flash-Lite failed on log, trying Flash...');
            try {
                content = await attemptGeneration('gemini-2.0-flash', messages, 1);
            } catch (e2) {
                console.error('[AI] All Gemini models failed in Analyze Log');
            }
        }

        let result = null;
        if (content) {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
                result = JSON.parse(clean.substring(first, last + 1));
            }
        }

        res.json(result || { type: 'workout', summary: 'Log', xp: 5, data: {} });

    } catch (error) {
        console.error('Analyze Log Error:', error);
        res.json({ type: 'workout', summary: 'Log', xp: 5, data: {} });
    }
};

const regenerateMeal = async (req, res) => {
    try {
        const { mealIndex, currentPlan } = req.body;
        console.log(`[AI] Regenerating meal at index ${mealIndex}...`);

        if (mealIndex === undefined || !currentPlan) {
            console.warn('[AI] Missing mealIndex or currentPlan');
            return res.status(400).json({ message: 'Invalid data' });
        }

        if (!currentPlan.meals || !Array.isArray(currentPlan.meals)) {
            console.warn('[AI] currentPlan.meals is missing or not an array');
            return res.status(400).json({ message: 'Missing meals array in plan' });
        }

        const mealTypes = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
        const mealType = mealTypes[mealIndex] || 'Meal';
        const currentMeal = currentPlan.meals[mealIndex] || { food: 'current meal' };

        const user = await User.findById(req.user._id);
        const profile = user?.profile || {};
        const { gender = 'Male', weight = 70, goals = [] } = profile;

        const primaryGoal = goals[0] || 'General Fitness';
        const systemPrompt = `Regenerate ${mealType}. Different from: ${currentMeal.food}. Output ONLY JSON: { "name": "${mealType}", "food": "Title", "calories": 0, "protein": 0, "suggestion": "Detail" }`;
        const userPrompt = `Profile: ${gender}, ${weight}kg, ${primaryGoal}. Generate a healthy Indian option.`;

        const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];

        let content;
        try {
            content = await attemptGeneration('gemini-2.0-flash', messages, 1);
        } catch (e) {
            console.warn('[AI] Gemini Flash failed on regenerate, trying Flash-Lite...');
            try {
                content = await attemptGeneration('gemini-2.0-flash-lite', messages, 1);
            } catch (e2) {
                console.warn('[AI] Flash-Lite failed, trying 1.5 Flash...');
                try {
                    content = await attemptGeneration('gemini-1.5-flash', messages, 1);
                } catch (e3) {
                    console.error('[AI] All Gemini models failed in Regenerate Meal');
                }
            }
        }

        let newMeal = null;
        if (content) {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
                try {
                    newMeal = JSON.parse(clean.substring(first, last + 1));
                } catch (jsonError) {
                    console.error('[AI] JSON Parse Error on regenerate:', jsonError.message);
                }
            }
        }

        // Final Fallback to prevent 500 error
        if (!newMeal) {
            console.log('[AI] Using fallback meal data...');
            newMeal = {
                name: mealType,
                food: mealIndex === 0 ? "Oats with Nuts & Berries" :
                    mealIndex === 1 ? "Paneer/Tofu Tikka with Salad" :
                        mealIndex === 2 ? "Roasted Makhana / Greek Yogurt" : "Dalia/Vegetable Khichdi",
                calories: 400,
                protein: 20,
                suggestion: "AI service busy. Try this healthy balanced swap!"
            };
        }

        res.json({ meal: newMeal });

    } catch (error) {
        console.error('Regenerate Error:', error.message);
        res.status(500).json({ message: 'Server error during meal regeneration', error: error.message });
    }
};

module.exports = { generateDietPlan, analyzeLog, regenerateMeal };
