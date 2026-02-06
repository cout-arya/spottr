const axios = require('axios');
const User = require('../models/User');
// RAG: Import vector store for nutrition knowledge retrieval
const vectorStore = require('../utils/vectorStore');

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

        console.log('[AI] Generating diet for User:', req.user?._id);

        // RAG: Construct nutrition query from user profile
        const primaryGoal = (goals || [])[0] || 'General Fitness';
        const nutritionQuery = `${primaryGoal} nutrition for ${gender || 'Male'} ${weight || 70}kg ${dietaryPreference || 'Non-vegetarian'}`;
        console.log('[RAG] Query:', nutritionQuery);

        // RAG: Retrieve relevant nutrition knowledge from vector database
        let retrievedContext = '';
        try {
            const relevantDocs = await vectorStore.retrieveContext(nutritionQuery, 3);
            if (relevantDocs.length > 0) {
                retrievedContext = vectorStore.formatContextForPrompt(relevantDocs);
                console.log(`[RAG] Retrieved ${relevantDocs.length} relevant documents`);
            } else {
                console.warn('[RAG] No context retrieved, proceeding without RAG');
            }
        } catch (ragError) {
            console.warn('[RAG] Context retrieval failed, proceeding without:', ragError.message);
        }

        // RAG: System prompt with injected nutrition knowledge
        const systemPrompt = `You are an expert nutritionist. Create a 1-day Indian diet plan (4 meals).

${retrievedContext ? `IMPORTANT: Use ONLY the following verified nutrition guidelines to create the plan:

${retrievedContext}

Follow these rules strictly:
- Base ALL recommendations on the provided nutrition guidelines above
- Do NOT invent nutrition rules, macro targets, or calorie recommendations
- Use the specific foods and portions mentioned in the guidelines
- Match protein targets to the retrieved knowledge

` : ''}
MEAL VARIETY RULES:
1. Breakfast should VARY between:
   - Egg dishes (masala omelette, boiled eggs, egg bhurji, scrambled)
   - Parathas (aloo paratha, paneer paratha, mooli paratha)
   - South Indian (dosa with chutney, idli sambar, upma, poha)
   - Smoothies/Bowls (protein smoothie with nuts, overnight oats with fruits)
   - Avoid always suggesting roti/sabzi for breakfast

2. Vary protein sources across meals:
   - Mix between eggs, chicken, fish, paneer, dal, yogurt
   - Use different cooking styles (grilled, boiled, sautéed, steamed)

3. Consider meal timing:
   - Breakfast: Quick-digesting carbs + protein for energy
   - Lunch: Balanced with complex carbs and vegetables
   - Snack: Light, protein-rich, easy to digest
   - Dinner: Moderate carbs, high protein, lighter than lunch

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
    "advice": "One short tip based on the guidelines"
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
                if (retries > 0) {
                    await sleep(2000);
                    return attemptGeneration(model, retries - 1);
                }
                throw error;
            }
        };

        const mockDiet = {
            calories: 2200,
            protein: 150,
            macros: { carbs: 200, fats: 70 },
            meals: [
                { name: "Breakfast", food: "Oats & Whey", calories: 400, protein: 30, suggestion: "Add berries" },
                { name: "Lunch", food: "Chicken Rice", calories: 700, protein: 50, suggestion: "Add veggies" },
                { name: "Snack", food: "Greek Yogurt", calories: 200, protein: 20, suggestion: "High protein" },
                { name: "Dinner", food: "Salmon & Asparagus", calories: 600, protein: 40, suggestion: "Light dinner" }
            ],
            advice: "Stay consistent with protein! (AI Service Unavailable)"
        };

        let dietPlan = null;
        try {
            let content;
            try {
                content = await attemptGeneration('google/gemini-2.0-flash-exp:free');
            } catch (e) {
                console.warn('[AI] Gemini failed, trying Llama 3.3 Free...');
                content = await attemptGeneration('meta-llama/llama-3.3-70b-instruct:free');
            }

            if (content) {
                const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const first = clean.indexOf('{');
                const last = clean.lastIndexOf('}');
                if (first !== -1 && last !== -1) {
                    dietPlan = JSON.parse(clean.substring(first, last + 1));
                }
            }
        } catch (aiError) {
            console.error('[AI] Generation process failed, falling back to mock.', aiError.message);
        }

        if (!dietPlan) {
            console.warn('[AI] Using Mock Diet Plan.');
            dietPlan = mockDiet;
        }

        // Save to User Profile
        try {
            const currentUser = await User.findById(req.user._id);
            if (currentUser) {
                if (!currentUser.plans) currentUser.plans = {};
                currentUser.plans.diet = dietPlan;
                await currentUser.save();
            }
        } catch (dbError) {
            console.error('[AI] Failed to save plan to DB:', dbError.message);
            // Continue to return the plan even if save failed
        }

        res.json(dietPlan);

    } catch (error) {
        console.error('Final AI Controller Error:', error.message);
        // Fallback catch-all
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

        console.log('[AI] Analyzing Log:', text);

        const systemPrompt = `You are an expert fitness AI. Analyze the user's natural language log.
        Determine if it is a 'meal' or a 'workout'.
        
        Output JSON ONLY. No markdown.
        Structure:
        {
           "type": "meal" | "workout",
           "summary": "Short title (e.g. 'Heavy Chest Day' or 'Healthy Salad')",
           "xp": 0, 
           // XP LOGIC:
           // MEAL: Calculate based heavily on Protein content and "Cleanliness". Range 5-50.
           // - High Protein (>25g) & Clean (e.g. Chicken, Eggs, Whey): Award 35-50 XP.
           // - Moderate Protein / Balanced Meal: Award 20-35 XP.
           // - Low Protein / Junk Food / High Sugar: Award 5-15 XP.
           // WORKOUT: Calculate based on Intensity/Duration. Range 30-100.
           
           "data": {
               // IF MEAL: Estimate nutritional values
               "calories": 0,
               "protein": 0, // grams
               "macros": { "carbs": 0, "fats": 0 }
               // IF WORKOUT: Estimate details
               "duration": "Estimate duration (e.g. 45 mins)",
               "intensity": "Low" | "Medium" | "High",
               "exercises": ["List of identified exercises"]
           }
        }`;

        const userPrompt = `User Log: "${text}"`;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const attemptGeneration = async (model, retries = 1) => {
            try {
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.5,
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
                return response.data.choices[0].message.content;
            } catch (error) {
                if (retries > 0) {
                    await sleep(2000);
                    return attemptGeneration(model, retries - 1);
                }
                throw error;
            }
        };

        const mockLogResponse = {
            type: (text.toLowerCase().includes('eat') || text.toLowerCase().includes('food') || text.toLowerCase().includes('meal')) ? 'meal' : 'workout',
            summary: "Logged Activity (AI Unavailable)",
            xp: 15,
            data: {
                calories: 200,
                protein: 15,
                macros: { carbs: 20, fats: 5 },
                duration: "30 mins",
                intensity: "Medium",
                exercises: ["General Activity"]
            }
        };

        let result = null;

        if (process.env.OPENROUTER_API_KEY) {
            try {
                let content;
                try {
                    content = await attemptGeneration('google/gemini-2.0-flash-exp:free');
                } catch (e) {
                    content = await attemptGeneration('mistralai/mistral-7b-instruct:free');
                }

                // Clean and Parse
                const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const first = clean.indexOf('{');
                const last = clean.lastIndexOf('}');
                if (first !== -1 && last !== -1) {
                    result = JSON.parse(clean.substring(first, last + 1));
                }
            } catch (aiError) {
                console.error('[AI] Analyze Log Failed:', aiError.message);
            }
        } else {
            console.warn('[AI] Missing API Key for analyzeLog.');
        }

        if (!result) {
            console.warn('[AI] Using Mock Log Result.');
            result = mockLogResponse;
        }

        res.json(result);

    } catch (error) {
        console.error('Final Analyze Log Error:', error.message);
        // Fallback to prevent crash
        res.json({
            type: 'workout',
            summary: "Activity Logged",
            xp: 5,
            data: {}
        });
    }
};

// Regenerate a single meal
const regenerateMeal = async (req, res) => {
    try {
        const { mealIndex, currentPlan } = req.body;

        if (mealIndex === undefined || !currentPlan) {
            return res.status(400).json({ message: 'Missing mealIndex or currentPlan' });
        }

        if (mealIndex < 0 || mealIndex > 3) {
            return res.status(400).json({ message: 'Invalid mealIndex. Must be 0-3' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = user.profile || {};
        const { gender, weight, dietaryPreference, goals } = profile;

        const mealTypes = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
        const mealType = mealTypes[mealIndex];
        const currentMeal = currentPlan.meals[mealIndex];

        console.log(`[AI] Regenerating ${mealType} (index ${mealIndex})`);

        // RAG: Build query for specific meal type
        const primaryGoal = (goals || [])[0] || 'General Fitness';
        const nutritionQuery = `${mealType} for ${primaryGoal} ${gender || 'Male'} ${weight || 70}kg ${dietaryPreference || 'Non-vegetarian'}`;
        console.log('[RAG] Query:', nutritionQuery);

        // RAG: Retrieve context
        let retrievedContext = '';
        try {
            const relevantDocs = await vectorStore.retrieveContext(nutritionQuery, 2);
            if (relevantDocs.length > 0) {
                retrievedContext = vectorStore.formatContextForPrompt(relevantDocs);
                console.log(`[RAG] Retrieved ${relevantDocs.length} documents for ${mealType}`);
            }
        } catch (ragError) {
            console.warn('[RAG] Context retrieval failed:', ragError.message);
        }

        // Meal-specific variety instructions
        const varietyInstructions = {
            'Breakfast': `VARY the breakfast. Options:
- Egg dishes: masala omelette, boiled eggs, egg bhurji, scrambled eggs
- Parathas: aloo paratha, paneer paratha, mooli paratha with curd
- South Indian: dosa with chutney, idli sambar, upma, poha
- Smoothies/Bowls: protein smoothie with nuts, overnight oats with fruits
- Avoid roti/sabzi for breakfast`,
            'Lunch': `Create a balanced lunch with:
- Complex carbs (brown rice, roti, quinoa)
- Protein (chicken, fish, paneer, dal)
- Vegetables (mixed sabzi, salad)
- Vary cooking styles (grilled, curry, dry sabzi)`,
            'Snack': `Light, protein-rich snack:
- Greek yogurt with nuts
- Protein shake with banana
- Boiled eggs with veggies
- Paneer tikka
- Sprouts chaat`,
            'Dinner': `Lighter dinner with high protein:
- Grilled chicken/fish with vegetables
- Dal with roti (limited)
- Paneer curry with salad
- Egg curry with minimal rice`
        };

        const systemPrompt = `You are an expert nutritionist. Generate a DIFFERENT ${mealType} option.

Current ${mealType}: ${currentMeal.food}
DO NOT repeat this. Create a completely different variation.

${retrievedContext ? `Use these nutrition guidelines:
${retrievedContext}

` : ''}${varietyInstructions[mealType]}

Output ONLY valid JSON for a single meal:
{
    "name": "${mealType}",
    "food": "Meal Title",
    "calories": 0,
    "protein": 0,
    "suggestion": "Detailed description"
}`;

        const userPrompt = `Profile: ${gender || 'Male'}, ${weight || 70}kg, ${dietaryPreference || 'Non-vegetarian'}.
Goal: ${primaryGoal}.
Task: Create a ${mealType} that is DIFFERENT from "${currentMeal.food}".`;

        // Call LLM
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const attemptGeneration = async (model, retries = 1) => {
            try {
                console.log(`[AI] Attempting ${mealType} generation with ${model}...`);
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.8  // Higher temperature for more variety
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            'HTTP-Referer': 'http://localhost:3000',
                            'X-Title': 'Spottr'
                        }
                    }
                );
                return response.data.choices[0].message.content;
            } catch (error) {
                console.error(`[AI] Error with ${model}:`, error.message);
                if (retries > 0) {
                    await sleep(2000);
                    return attemptGeneration(model, retries - 1);
                }
                throw error;
            }
        };

        let newMeal = null;
        try {
            let content;
            try {
                content = await attemptGeneration('google/gemini-2.0-flash-exp:free');
            } catch (e) {
                console.warn('[AI] Gemini failed, trying Llama 3.3 Free...');
                content = await attemptGeneration('meta-llama/llama-3.3-70b-instruct:free');
            }

            if (content) {
                try {
                    let clean = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                    const first = clean.indexOf('{');
                    const last = clean.lastIndexOf('}');

                    if (first !== -1 && last !== -1) {
                        const jsonStr = clean.substring(first, last + 1);
                        newMeal = JSON.parse(jsonStr);
                        console.log(`[AI] Successfully regenerated ${mealType}`);
                    }
                } catch (parseError) {
                    console.error('[AI] JSON parsing failed:', parseError.message);
                }
            }
        } catch (aiError) {
            console.error('[AI] Generation failed:', aiError.message);
        }

        // Fallback if generation failed
        if (!newMeal) {
            return res.status(500).json({ message: 'Failed to regenerate meal. Please try again.' });
        }

        res.json({ meal: newMeal });

    } catch (error) {
        console.error('Regenerate Meal Error:', error.message);
        res.status(500).json({ message: 'Server error during meal regeneration' });
    }
};

module.exports = { generateDietPlan, analyzeLog, regenerateMeal };
