// Vector Store Module for RAG Retrieval
// Uses Google Gemini text-embedding-004 for query embeddings
// and cosine similarity for search

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Application Configuration
const EMBEDDINGS_FILE = path.join(__dirname, '../data/vectors/nutrition_embeddings.json');
const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

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
        console.log(`[VectorStore] Loaded ${embeddingsCache.length} nutrition embeddings (Gemini 768-dim)`);
        return embeddingsCache;
    } catch (error) {
        console.warn('[VectorStore] Failed to load embeddings:', error.message);
        console.warn('[VectorStore] RAG retrieval will be unavailable');
        return [];
    }
}

/**
 * Generate embedding for a query using Gemini SDK
 */
async function generateEmbedding(text) {
    const apiKey = process.env.gemini_key;
    if (!apiKey) throw new Error('gemini_key not configured');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('[VectorStore] Gemini sdk embedding generation failed:', error.message);
        throw error;
    }
}

/**
 * Perform similarity search to find most relevant documents
 */
async function similaritySearch(queryEmbedding, topK = 3) {
    const embeddings = await loadEmbeddings();

    if (embeddings.length === 0) {
        console.warn('[VectorStore] No embeddings available for search');
        return [];
    }

    const results = embeddings.map(doc => ({
        id: doc.id,
        source: doc.source,
        text: doc.text,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    results.sort((a, b) => b.score - a.score);

    const topResults = results.slice(0, topK);

    console.log(`[VectorStore] Retrieved ${topResults.length} documents (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`);

    return topResults;
}

/**
 * High-level retrieval function: takes query text, returns relevant documents
 */
async function retrieveContext(queryText, topK = 3) {
    try {
        const queryEmbedding = await generateEmbedding(queryText);
        const results = await similaritySearch(queryEmbedding, topK);
        return results;
    } catch (error) {
        console.error('[VectorStore] Context retrieval failed:', error.message);
        return [];
    }
}

/**
 * Format retrieved documents for prompt injection
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
