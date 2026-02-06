// Vector Store Module for RAG Retrieval
// Handles loading embeddings and performing similarity search

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const EMBEDDINGS_FILE = path.join(__dirname, '../data/vectors/nutrition_embeddings.json');

// API Configuration - support both OpenAI and OpenRouter
const API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const USE_OPENROUTER = !process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY;

// Use OpenRouter's model path format when using OpenRouter
const OPENAI_EMBEDDING_MODEL = USE_OPENROUTER
    ? 'openai/text-embedding-3-small'  // OpenRouter requires provider prefix
    : 'text-embedding-3-small';         // Direct OpenAI API

// In-memory cache of embeddings
let embeddingsCache = null;

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1 (higher = more similar)
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

/**
 * Load embeddings from JSON file into memory
 * Called once on server startup or first use
 */
async function loadEmbeddings() {
    if (embeddingsCache) {
        return embeddingsCache;
    }

    try {
        const data = await fs.readFile(EMBEDDINGS_FILE, 'utf-8');
        embeddingsCache = JSON.parse(data);
        console.log(`[VectorStore] Loaded ${embeddingsCache.length} nutrition embeddings`);
        return embeddingsCache;
    } catch (error) {
        console.warn('[VectorStore] Failed to load embeddings:', error.message);
        console.warn('[VectorStore] RAG retrieval will be unavailable');
        return [];
    }
}

/**
 * Generate embedding for a query using OpenAI API (or OpenRouter)
 */
async function generateEmbedding(text) {
    if (!API_KEY) {
        throw new Error('Neither OPENAI_API_KEY nor OPENROUTER_API_KEY configured');
    }

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
        console.error('[VectorStore] Embedding generation failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Perform similarity search to find most relevant documents
 * 
 * @param {Array} queryEmbedding - The query vector
 * @param {number} topK - Number of top results to return (default: 3)
 * @returns {Array} Array of {text, source, score} objects, sorted by relevance
 */
async function similaritySearch(queryEmbedding, topK = 3) {
    // Load embeddings if not already loaded
    const embeddings = await loadEmbeddings();

    if (embeddings.length === 0) {
        console.warn('[VectorStore] No embeddings available for search');
        return [];
    }

    // Calculate similarity scores for all documents
    const results = embeddings.map(doc => ({
        id: doc.id,
        source: doc.source,
        text: doc.text,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by score (descending) and return top K
    results.sort((a, b) => b.score - a.score);

    const topResults = results.slice(0, topK);

    console.log(`[VectorStore] Retrieved ${topResults.length} documents (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

    return topResults;
}

/**
 * High-level retrieval function: takes query text, returns relevant documents
 * 
 * @param {string} queryText - Natural language query
 * @param {number} topK - Number of results to return
 * @returns {Array} Array of relevant document chunks
 */
async function retrieveContext(queryText, topK = 3) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(queryText);

        // Perform similarity search
        const results = await similaritySearch(queryEmbedding, topK);

        return results;
    } catch (error) {
        console.error('[VectorStore] Context retrieval failed:', error.message);
        return [];
    }
}

/**
 * Format retrieved documents for prompt injection
 * 
 * @param {Array} documents - Array of retrieved documents
 * @returns {string} Formatted context string
 */
function formatContextForPrompt(documents) {
    if (documents.length === 0) {
        return '';
    }

    return documents.map((doc, index) =>
        `[Source ${index + 1}: ${doc.source}]\n${doc.text}`
    ).join('\n\n---\n\n');
}

// Pre-load embeddings on module import (async, non-blocking)
loadEmbeddings().catch(err => {
    console.warn('[VectorStore] Initial embedding load failed:', err.message);
});

module.exports = {
    loadEmbeddings,
    generateEmbedding,
    similaritySearch,
    retrieveContext,
    formatContextForPrompt,
    cosineSimilarity
};
