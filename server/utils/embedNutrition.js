// Embedding Generation Script for Nutrition Knowledge Base
// Uses Google Gemini text-embedding-004 model
// Run manually: node utils/embedNutrition.js

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configuration
const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge/nutrition');
const OUTPUT_DIR = path.join(__dirname, '../data/vectors');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nutrition_embeddings.json');
const CHUNK_SIZE = 1000; // Characters per chunk

// Gemini API Configuration
const GEMINI_API_KEY = process.env.gemini_key;
const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;

/**
 * Generate embedding for a text chunk using Gemini API
 */
async function generateEmbedding(text) {
    try {
        const response = await axios.post(
            `${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`,
            {
                model: `models/${GEMINI_EMBEDDING_MODEL}`,
                content: {
                    parts: [{ text: text }]
                }
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        return response.data.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Split text into chunks (simple paragraph-based chunking)
 */
function chunkText(text, maxChunkSize = CHUNK_SIZE) {
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Process a single nutrition file
 */
async function processFile(filePath, fileName) {
    console.log(`\n📄 Processing: ${fileName}`);

    const content = await fs.readFile(filePath, 'utf-8');
    const chunks = chunkText(content);
    console.log(`   ✂️  Split into ${chunks.length} chunks`);

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`   🔄 Generating embedding ${i + 1}/${chunks.length}...`);

        try {
            const embedding = await generateEmbedding(chunks[i]);
            embeddings.push({
                id: `${fileName.replace('.txt', '')}_chunk_${i}`,
                source: fileName,
                text: chunks[i],
                embedding: embedding
            });

            // Rate limiting: Gemini free tier is generous (1500 RPM),
            // but a small delay prevents bursts
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`   ❌ Failed to generate embedding for chunk ${i}:`, error.message);
            throw error;
        }
    }

    console.log(`   ✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting Nutrition Knowledge Base Embedding Generation (Gemini)\n');
    console.log(`📂 Knowledge Directory: ${KNOWLEDGE_DIR}`);
    console.log(`💾 Output File: ${OUTPUT_FILE}\n`);

    if (!GEMINI_API_KEY) {
        console.error('❌ ERROR: gemini_key not found in environment variables');
        console.error('   Please add gemini_key to your .env file');
        process.exit(1);
    }

    console.log(`🔑 Using Gemini API (${GEMINI_EMBEDDING_MODEL}) for embeddings\n`);

    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log('✅ Output directory ready\n');

        const files = await fs.readdir(KNOWLEDGE_DIR);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        console.log(`📚 Found ${txtFiles.length} nutrition files:`);
        txtFiles.forEach(f => console.log(`   - ${f}`));

        let allEmbeddings = [];
        for (const file of txtFiles) {
            const filePath = path.join(KNOWLEDGE_DIR, file);
            const embeddings = await processFile(filePath, file);
            allEmbeddings = allEmbeddings.concat(embeddings);
        }

        console.log(`\n💾 Saving ${allEmbeddings.length} embeddings to ${OUTPUT_FILE}...`);
        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(allEmbeddings, null, 2),
            'utf-8'
        );

        const stats = await fs.stat(OUTPUT_FILE);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ EMBEDDING GENERATION COMPLETE!');
        console.log(`   📊 Total embeddings: ${allEmbeddings.length}`);
        console.log(`   📐 Dimension: 768 (Gemini text-embedding-004)`);
        console.log(`   📁 File size: ${fileSizeMB} MB`);
        console.log(`   📍 Location: ${OUTPUT_FILE}`);
        console.log('\n🎉 Nutrition knowledge base is ready for RAG retrieval!\n');

    } catch (error) {
        console.error('\n❌ EMBEDDING GENERATION FAILED:');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { generateEmbedding, chunkText };
