const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const vectorStore = require('../utils/vectorStore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initialize Gemini client
 */
function getGenAI() {
    const key = process.env.gemini_key;
    if (!key) throw new Error('gemini_key not configured');
    return new GoogleGenerativeAI(key);
}

/**
 * Unified Helper for Gemini AI calls using official SDK
 * Accepts OpenAI-style messages and converts to Gemini format
 */
const attemptGeneration = async (modelName, messages, retries = 1) => {
    try {
        console.log(`[AI] Attempting generation with ${modelName}...`);
        const genAI = getGenAI();

        let combinedPrompt = '';

        for (const msg of messages) {
            if (msg.role === 'system') {
                combinedPrompt += msg.content + '\n\n';
            } else if (msg.role === 'user') {
                combinedPrompt += msg.content;
            }
        }

        const modelConfig = {
            model: modelName,
            systemInstruction: messages.find(m => m.role === 'system')?.content || '',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 16384,
                thinkingConfig: {
                    thinkingBudget: 1024
                }
            }
        };

        const model = genAI.getGenerativeModel(modelConfig);
        
        // Ensure we send the user prompt
        const userPrompt = messages.find(m => m.role === 'user')?.content || combinedPrompt;
        
        console.log(`[AI] Generating with prompt length: ${userPrompt.length}`);
        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        if (!text) throw new Error('Empty response from Gemini');

        console.log(`[AI] Response received from ${modelName}. Length: ${text.length}`);
        return text;
    } catch (error) {
        const errMsg = error.message || 'Unknown error';
        console.error(`[AI] Error with ${modelName}: ${errMsg}`);
        // If it's a specific quota or 429 error, it's better to immediately fall back to OpenRouter!
        if (retries > 0 && !(errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted'))) {
            const waitTime = 2000;
            console.log(`[AI] Retrying in ${waitTime}ms...`);
            await sleep(waitTime);
            return attemptGeneration(modelName, messages, retries - 1);
        }
        throw error;
    }
};

/**
 * OpenRouter Helper
 */
const attemptOpenRouter = async (modelName, messages) => {
    console.log(`[AI] Attempting generation with OpenRouter: ${modelName}...`);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: modelName,
        messages: messages
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:5001',
            'X-Title': 'Spottr'
        }
    });
    
    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenRouter');
    
    console.log(`[AI] Response received from OpenRouter ${modelName}. Length: ${text.length}`);
    return text;
};

/**
 * Try multiple models in sequence until one succeeds
 */
const tryModels = async (models, messages) => {
    for (let i = 0; i < models.length; i++) {
        try {
            if (models[i].startsWith('openrouter:')) {
                return await attemptOpenRouter(models[i].split('openrouter:')[1], messages);
            } else {
                return await attemptGeneration(models[i], messages, 1);
            }
        } catch (e) {
            console.warn(`[AI] ${models[i]} failed${i < models.length - 1 ? ', trying next...' : ''}`);
        }
    }
    console.error('[AI] All models exhausted');
    return null;
};

// Model priority list - tested and verified working with this API key
const FAST_MODELS = ['gemini-2.5-flash', 'openrouter:meta-llama/llama-3.3-70b-instruct', 'openrouter:google/gemini-flash-1.5-8b'];
const LITE_MODELS = ['gemini-2.5-flash', 'openrouter:google/gemini-flash-1.5-8b'];

/**
 * Extract JSON from potentially markdown-wrapped response
 * Handles truncated or malformed JSON more gracefully
 */
const extractJSON = (content) => {
    if (!content) return null;
    try {
        // Try direct parse first
        return JSON.parse(content);
    } catch (e) {
        // Continue to cleaning
    }

    const clean = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    
    if (first !== -1 && last !== -1) {
        const potentialJson = clean.substring(first, last + 1);
        try {
            return JSON.parse(potentialJson);
        } catch (e) {
            console.error('[AI] JSON Parse Error:', e.message);
            // If it's a structural error, it might be due to truncation or extra text
            // We'll let the caller handle the null
        }
    }
    return null;
};

const generateDietPlan = async (req, res) => {
    try {
        console.log("generateDietPlan called!");
        if (!process.env.gemini_key) {
            console.error("Gemini API Key Missing");
            return res.status(500).json({ message: 'Server Configuration Error: Gemini API Key Missing' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            console.error("User not found!");
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = user.profile || {};
        const { age, gender, height, weight, dietaryPreference, goals } = profile;
        console.log("Profile Data:", { age, gender, height, weight, dietaryPreference, goals });

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

        console.log("systemPrompt:", systemPrompt);
        console.log("userPrompt:", userPrompt);
        console.log("Attempting to call tryModels...");

        const content = await tryModels(FAST_MODELS, messages);
        console.log("Raw Diet Plan Output:", content);
        let dietPlan = extractJSON(content);

        console.log("Resulting diet plan after extractJSON:", dietPlan);

        // Verify structure - if meals or advice is missing, it's a failed generation
        if (!dietPlan || !dietPlan.meals || !Array.isArray(dietPlan.meals) || dietPlan.meals.length === 0) {
            console.warn("Diet plan is null, invalid or truncated. Falling back to default plan.");
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
                advice: "Stay consistent with protein! (AI Generation was incomplete - using fallback)"
            };
        }

        console.log("Saving diet plan to db...");
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
            advice: "Service Temporarily Unavailable"
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

        const content = await tryModels(LITE_MODELS, messages);
        const result = extractJSON(content);

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

        console.log("systemPrompt for regenerateMeal:", systemPrompt);
        console.log("userPrompt for regenerateMeal:", userPrompt);
        console.log("Attempting to call tryModels for regenerateMeal...");

        const content = await tryModels(FAST_MODELS, messages);
        console.log("Raw Regenerate Meal Output:", content);
        let newMeal = extractJSON(content);

        console.log("Resulting meal after extractJSON:", newMeal);

        // Final Fallback
        if (!newMeal) {
            console.warn('[AI] Using fallback meal data...');
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
