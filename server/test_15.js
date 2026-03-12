const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGenAI() {
    return new GoogleGenerativeAI('AIzaSyDsnyEgH0_nRS_6YIT1DYZn-NwOVyG5hSk');
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const attemptGeneration = async (modelName, messages, retries = 1) => {
    try {
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
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        };

        const model = genAI.getGenerativeModel(modelConfig);
        const result = await model.generateContent(combinedPrompt);
        return result.response.text();
    } catch (error) {
        const errMsg = error.message || 'Unknown error';
        console.error(`[AI] Error with ${modelName}: ${errMsg}`);
        if (retries > 0) {
            const waitTime = errMsg.includes('429') || errMsg.includes('quota') ? 5000 : 2000;
            console.log(`[AI] Retrying in ${waitTime}ms...`);
            await sleep(waitTime);
            return attemptGeneration(modelName, messages, retries - 1);
        }
        throw error;
    }
};

const FAST_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

const tryModels = async (models, messages) => {
    for (let i = 0; i < models.length; i++) {
        try {
            return await attemptGeneration(models[i], messages, 1);
        } catch (e) {
            console.warn(`[AI] ${models[i]} failed${i < models.length - 1 ? ', trying next...' : ''}`);
        }
    }
    console.error('[AI] All models exhausted');
    return null;
};

async function run() {
    const systemPrompt = `You are an expert nutritionist. Create a 1-day Indian diet plan (4 meals). Output ONLY valid JSON. No markdown. Structure: { "data": "yes" }`;
    const userPrompt = `Test prompt`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    const content = await tryModels(FAST_MODELS, messages);
    console.log("Raw Response:");
    console.log(content);
}

run();
