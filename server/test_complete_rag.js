// Comprehensive RAG Flow Test with OpenRouter
const axios = require('axios');
require('dotenv').config();
const vectorStore = require('./utils/vectorStore');

async function testCompleteRAGFlow() {
    console.log('='.repeat(70));
    console.log('COMPLETE RAG FLOW TEST - OpenRouter Embeddings + LLM');
    console.log('='.repeat(70));

    // Step 1: Test Embedding Generation
    console.log('\n[STEP 1] Testing OpenRouter Embedding API');
    console.log('-'.repeat(70));
    try {
        const testQuery = 'Muscle Gain nutrition for Male 70kg Non-vegetarian';
        console.log('Query:', testQuery);

        const embedding = await vectorStore.generateEmbedding(testQuery);
        console.log('✅ Embedding generated successfully');
        console.log('   Embedding dimension:', embedding.length);
        console.log('   First 5 values:', embedding.slice(0, 5).map(v => v.toFixed(4)).join(', '));
    } catch (err) {
        console.log('❌ Embedding generation FAILED');
        console.log('   Error:', err.message);
        if (err.response?.data) {
            console.log('   Details:', JSON.stringify(err.response.data, null, 2));
        }
        return;
    }

    // Step 2: Test Vector Store Loading
    console.log('\n[STEP 2] Testing Vector Store Loading');
    console.log('-'.repeat(70));
    try {
        const embeddings = await vectorStore.loadEmbeddings();
        console.log('✅ Vector store loaded successfully');
        console.log('   Total embeddings:', embeddings.length);
        console.log('   Sources:', [...new Set(embeddings.map(e => e.source))].join(', '));
    } catch (err) {
        console.log('❌ Vector store loading FAILED');
        console.log('   Error:', err.message);
    }

    // Step 3: Test Context Retrieval
    console.log('\n[STEP 3] Testing RAG Context Retrieval');
    console.log('-'.repeat(70));
    let retrievedContext = '';
    try {
        const query = 'Muscle Gain nutrition for Male 70kg Non-vegetarian';
        const docs = await vectorStore.retrieveContext(query, 3);

        console.log('✅ Context retrieved successfully');
        console.log('   Retrieved documents:', docs.length);

        docs.forEach((doc, i) => {
            console.log(`\n   Document ${i + 1}:`);
            console.log(`   - Source: ${doc.source}`);
            console.log(`   - Score: ${doc.score.toFixed(4)}`);
            console.log(`   - Preview: ${doc.text.substring(0, 100)}...`);
        });

        retrievedContext = vectorStore.formatContextForPrompt(docs);
        console.log('\n   Context formatted for prompt (length:', retrievedContext.length, 'chars)');

    } catch (err) {
        console.log('❌ Context retrieval FAILED');
        console.log('   Error:', err.message);
    }

    // Step 4: Test LLM with RAG Context
    console.log('\n[STEP 4] Testing LLM Generation with RAG Context');
    console.log('-'.repeat(70));
    try {
        const systemPrompt = `You are an expert nutritionist. Use ONLY the following verified nutrition guidelines:

${retrievedContext}

Create a 1-day Indian diet plan (4 meals). Output ONLY valid JSON:
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

        const userPrompt = `Profile: 25yo Male, 170cm, 70kg.
Diet Type: Non-vegetarian.
Primary Goal: Muscle Gain.
Create a personalized 1-day Indian diet plan.`;

        console.log('Calling LLM with RAG context...');
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
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

        console.log('✅ LLM generation successful');
        const content = response.data.choices[0].message.content;
        console.log('\n   Response preview:');
        console.log('   ' + content.substring(0, 200) + '...');

        // Try to parse as JSON
        try {
            const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
                const json = JSON.parse(clean.substring(first, last + 1));
                console.log('\n   ✅ Valid JSON diet plan generated!');
                console.log('   - Calories:', json.calories);
                console.log('   - Protein:', json.protein);
                console.log('   - Meals:', json.meals?.length || 0);
            }
        } catch (e) {
            console.log('\n   ⚠️  Response is not valid JSON (but LLM worked)');
        }

    } catch (err) {
        console.log('❌ LLM generation FAILED');
        console.log('   Status:', err.response?.status);
        console.log('   Error:', err.response?.data?.error?.message || err.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('RAG FLOW TEST COMPLETE');
    console.log('='.repeat(70));
}

testCompleteRAGFlow();
