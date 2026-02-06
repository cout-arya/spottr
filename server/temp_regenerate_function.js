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
                content = await attemptGeneration('meta-llama/llama-3.3-70b-instruct');
            } catch (e) {
                console.warn('[AI] Llama failed, trying Qwen...');
                content = await attemptGeneration('qwen/qwen-2.5-7b-instruct');
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
