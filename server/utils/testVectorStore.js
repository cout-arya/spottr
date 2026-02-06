// Test script for vector store retrieval
// Run: node utils/testVectorStore.js

const vectorStore = require('./vectorStore');
require('dotenv').config();

async function testRetrieval() {
    console.log('🧪 Testing Vector Store Retrieval\n');

    // Test queries
    const testQueries = [
        'high protein for muscle gain',
        'fat loss diet for 70kg male',
        'Indian food macros for chicken and rice',
        'pre workout meal suggestions',
        'vegetarian protein sources'
    ];

    for (const query of testQueries) {
        console.log(`\n📝 Query: "${query}"`);
        console.log('─'.repeat(60));

        try {
            const results = await vectorStore.retrieveContext(query, 3);

            if (results.length === 0) {
                console.log('❌ No results found');
                continue;
            }

            results.forEach((doc, index) => {
                console.log(`\n${index + 1}. Source: ${doc.source} (Score: ${doc.score.toFixed(3)})`);
                console.log(`   Preview: ${doc.text.substring(0, 150)}...`);
            });

        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    console.log('\n\n✅ Test complete!\n');
}

// Run tests
testRetrieval().catch(console.error);
