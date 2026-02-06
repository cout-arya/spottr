// Embedding Generation Script for Nutrition Knowledge Base
// This is a ONE-TIME script to generate embeddings from nutrition text files
// Run manually: node utils/embedNutrition.js

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configuration
const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge/nutrition');
const OUTPUT_DIR = path.join(__dirname, '../data/vectors');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nutrition_embeddings.json');
const CHUNK_SIZE = 1000; // Characters per chunk (adjust if needed)

// API Configuration - support both OpenAI and OpenRouter
const API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const USE_OPENROUTER = !process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY;

// Use OpenRouter's model path format when using OpenRouter
const OPENAI_EMBEDDING_MODEL = USE_OPENROUTER
    ? 'openai/text-embedding-3-small'  // OpenRouter requires provider prefix
    : 'text-embedding-3-small';         // Direct OpenAI API

/**
 * Generate embedding for a text chunk using OpenAI API (or OpenRouter)
 */
async function generateEmbedding(text) {
    try {
        const endpoint = USE_OPENROUTER
            ? 'https://openrouter.ai/api/v1/embeddings'
            : 'https://api.openai.com/v1/embeddings';

        const headers = USE_OPENROUTER
            ? {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'TinderGymBuddies'
            }
            : {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            };

        const response = await axios.post(
            endpoint,
            {
                model: OPENAI_EMBEDDING_MODEL,
                input: text
            },
            { headers }
        );
        return response.data.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Split text into chunks (simple paragraph-based chunking)
 */
function chunkText(text, maxChunkSize = CHUNK_SIZE) {
    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If adding this paragraph exceeds chunk size, save current chunk
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    // Add remaining chunk
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

    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Chunk the content
    const chunks = chunkText(content);
    console.log(`   ✂️  Split into ${chunks.length} chunks`);

    // Generate embeddings for each chunk
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

            // Rate limiting: wait 200ms between API calls
            await new Promise(resolve => setTimeout(resolve, 200));
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
    console.log('🚀 Starting Nutrition Knowledge Base Embedding Generation\n');
    console.log(`📂 Knowledge Directory: ${KNOWLEDGE_DIR}`);
    console.log(`💾 Output File: ${OUTPUT_FILE}\n`);

    // Validate API key
    if (!API_KEY) {
        console.error('❌ ERROR: Neither OPENAI_API_KEY nor OPENROUTER_API_KEY found in environment variables');
        console.error('   Please add one of these keys to your .env file');
        process.exit(1);
    }

    console.log(`🔑 Using ${USE_OPENROUTER ? 'OpenRouter' : 'OpenAI'} API for embeddings\n`);

    try {
        // Create output directory if it doesn't exist
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log('✅ Output directory ready\n');

        // Read all .txt files from knowledge directory
        const files = await fs.readdir(KNOWLEDGE_DIR);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        console.log(`📚 Found ${txtFiles.length} nutrition files:`);
        txtFiles.forEach(f => console.log(`   - ${f}`));

        // Process each file
        let allEmbeddings = [];
        for (const file of txtFiles) {
            const filePath = path.join(KNOWLEDGE_DIR, file);
            const embeddings = await processFile(filePath, file);
            allEmbeddings = allEmbeddings.concat(embeddings);
        }

        // Save embeddings to JSON file
        console.log(`\n💾 Saving ${allEmbeddings.length} embeddings to ${OUTPUT_FILE}...`);
        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(allEmbeddings, null, 2),
            'utf-8'
        );

        // Calculate file size
        const stats = await fs.stat(OUTPUT_FILE);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ EMBEDDING GENERATION COMPLETE!');
        console.log(`   📊 Total embeddings: ${allEmbeddings.length}`);
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
