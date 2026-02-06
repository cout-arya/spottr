// Comprehensive RAG System Test
const axios = require('axios');
require('dotenv').config();

const vectorStore = require('./utils/vectorStore');

async function testFullRAGFlow() {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE RAG SYSTEM TEST');
    console.log('='.repeat(60));

    // Test 1: Environment Variables
    console.log('\n[TEST 1] Environment Variables');
    console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('API Key prefix:', process.env.OPENROUTER_API_KEY?.substring(0, 15) + '...');

    // Test 2: Vector Store Loading
    console.log('\n[TEST 2] Vector Store Loading');
    try {
        const embeddings = await vectorStore.loadEmbeddings();
        console.log('✅ Embeddings loaded:', embeddings.length);
    } catch (err) {
        console.error('❌ Failed to load embeddings:', err.message);
    }

    // Test 3: Embedding Generation
    console.log('\n[TEST 3] Embedding Generation');
    try {
        const testQuery = 'Muscle Gain nutrition for Male 70kg Non-vegetarian';
        console.log('Query:', testQuery);
        const embedding = await vectorStore.generateEmbedding(testQuery);
        console.log('✅ Embedding generated, length:', embedding.length);
    } catch (err) {
        console.error('❌ Embedding generation failed:', err.message);
        console.error('Error details:', err.response?.data || err);
    }

    // Test 4: Context Retrieval
    console.log('\n[TEST 4] Context Retrieval');
    try {
        const query = 'Muscle Gain nutrition for Male 70kg Non-vegetarian';
        const docs = await vectorStore.retrieveContext(query, 3);
        console.log('✅ Retrieved documents:', docs.length);
        docs.forEach((doc, i) => {
            console.log(`  Doc ${i + 1}: ${doc.source} (score: ${doc.score.toFixed(3)})`);
            console.log(`    Preview: ${doc.text.substring(0, 100)}...`);
        });
    } catch (err) {
        console.error('❌ Context retrieval failed:', err.message);
    }

    // Test 5: LLM API Call
    console.log('\n[TEST 5] LLM API Call');
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemini-flash-1.5',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say "Hello, RAG system works!" in JSON format with a "message" field.' }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Spottr'
                }
            }
        );
        console.log('✅ LLM Response:', response.data.choices[0].message.content);
    } catch (err) {
        console.error('❌ LLM call failed');
        console.error('Status:', err.response?.status);
        console.error('Error:', err.response?.data || err.message);
    }

    // Test 6: Full RAG Pipeline
    console.log('\n[TEST 6] Full RAG Pipeline (Embedding + Retrieval + LLM)');
    try {
        const query = 'Muscle Gain nutrition for Male 70kg Non-vegetarian';
        const docs = await vectorStore.retrieveContext(query, 3);
        const context = vectorStore.formatContextForPrompt(docs);

        console.log('Context length:', context.length, 'characters');
        console.log('Context preview:', context.substring(0, 200) + '...');

        const systemPrompt = `You are a nutritionist. Use ONLY this knowledge:\n\n${context}\n\nRespond in JSON with a "summary" field.`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'google/gemini-flash-1.5',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'What protein target should a 70kg male have for muscle gain?' }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Spottr'
                }
            }
        );

        console.log('✅ RAG Pipeline Response:', response.data.choices[0].message.content);
    } catch (err) {
        console.error('❌ Full RAG pipeline failed:', err.message);
        console.error('Error details:', err.response?.data || err);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
}

testFullRAGFlow().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
