# RAG Architecture - README

## Overview

This application now uses **Retrieval-Augmented Generation (RAG)** for nutrition-based AI features. Instead of relying solely on the LLM's training data, we retrieve relevant nutrition knowledge from a curated knowledge base before generating responses.

## Architecture Flow

```
User Profile → Query Construction → Embedding Generation → Vector Search → 
Context Retrieval → Prompt Injection → LLM Generation → Grounded Response
```

## Components

### 1. Knowledge Base (`/knowledge/nutrition/`)

Curated nutrition text files:
- `muscle_gain.txt` - Muscle building guidelines
- `fat_loss.txt` - Fat loss strategies
- `indian_macros.txt` - Indian food nutritional data
- `protein_sources.txt` - Protein source database
- `pre_post_workout.txt` - Workout nutrition timing

### 2. Embedding Generation (`server/utils/embedNutrition.js`)

One-time script to generate embeddings:
```bash
cd server
node utils/embedNutrition.js
```

This creates `server/data/vectors/nutrition_embeddings.json` containing:
- Text chunks from knowledge base
- OpenAI embeddings (text-embedding-3-small)
- Source file metadata

### 3. Vector Store (`server/utils/vectorStore.js`)

Runtime module providing:
- `loadEmbeddings()` - Load vectors into memory
- `generateEmbedding(text)` - Create query embeddings
- `similaritySearch(embedding, topK)` - Find similar documents
- `retrieveContext(query, topK)` - High-level retrieval
- `formatContextForPrompt(docs)` - Format for LLM injection

Uses cosine similarity for vector comparison.

### 4. RAG Integration (`server/controllers/aiController.js`)

**Diet Plan Generation:**
1. Construct query from user profile (goal, weight, gender, diet preference)
2. Retrieve top 3 relevant nutrition documents
3. Inject retrieved context into system prompt
4. Instruct LLM to use only retrieved knowledge
5. Generate grounded diet plan

**Log Analysis (Optional):**
1. Detect meal-related logs
2. Retrieve nutrition guidelines
3. Use context for XP calculation and validation

## Setup Instructions

### Prerequisites
- OpenAI API key in `.env` file
- Node.js installed

### Step 1: Generate Embeddings
```bash
cd server
node utils/embedNutrition.js
```

Expected output:
```
✅ EMBEDDING GENERATION COMPLETE!
   📊 Total embeddings: 25-30
   📁 File size: ~2-5 MB
   📍 Location: server/data/vectors/nutrition_embeddings.json
```

### Step 2: Test Retrieval (Optional)
```bash
node utils/testVectorStore.js
```

Verifies vector search is working correctly.

### Step 3: Run Server
```bash
npm run dev
```

The vector store loads embeddings on startup. Look for:
```
[VectorStore] Loaded 28 nutrition embeddings
```

## Usage

### Generate Diet Plan (with RAG)
```bash
POST /api/ai/diet
Authorization: Bearer <token>
```

Console logs will show:
```
[RAG] Query: Muscle Gain nutrition for Male 70kg Non-vegetarian
[RAG] Retrieved 3 relevant documents
[VectorStore] Retrieved 3 documents (scores: 0.842, 0.789, 0.756)
```

### Analyze Food Log (with RAG)
```bash
POST /api/ai/analyze
Body: { "text": "Had 200g chicken breast with rice" }
```

Console logs:
```
[RAG] Retrieved 2 documents for meal analysis
```

## Interview Explanation

**Question:** "How does your RAG system work?"

**Answer:**
> "We retrieve nutrition knowledge from a vector database before generation to ground responses and reduce hallucinations. 
> 
> First, we curated a knowledge base of verified nutrition guidelines. We generated embeddings for this content using OpenAI's text-embedding-3-small model and stored them in a vector database.
>
> At runtime, when a user requests a diet plan, we construct a query from their profile (goal, weight, dietary preference), generate an embedding for that query, and perform cosine similarity search to find the 3 most relevant nutrition documents.
>
> We then inject this retrieved context directly into the LLM's system prompt with explicit instructions to base all recommendations on the provided guidelines. This ensures our diet plans are grounded in verified nutrition science rather than potentially hallucinated information."

## Benefits

1. **Grounded Responses** - Based on verified nutrition knowledge
2. **Explainable** - Can trace recommendations back to source documents
3. **Updatable** - Modify knowledge base without retraining models
4. **Cost-Effective** - Embedding generation is one-time, queries are cheap
5. **Interview-Ready** - Clear architecture demonstrating RAG understanding

## Fallback Behavior

If RAG fails (missing embeddings, API errors):
- System logs warning
- Proceeds with standard LLM generation
- No breaking changes to user experience

## File Structure

```
server/
├── controllers/
│   └── aiController.js          # RAG-enhanced AI endpoints
├── utils/
│   ├── embedNutrition.js        # One-time embedding generation
│   ├── vectorStore.js           # Runtime vector retrieval
│   └── testVectorStore.js       # Testing utility
├── data/
│   └── vectors/
│       └── nutrition_embeddings.json  # Generated embeddings
knowledge/
└── nutrition/
    ├── muscle_gain.txt
    ├── fat_loss.txt
    ├── indian_macros.txt
    ├── protein_sources.txt
    └── pre_post_workout.txt
```

## Maintenance

**Updating Knowledge Base:**
1. Edit/add files in `/knowledge/nutrition/`
2. Re-run: `node utils/embedNutrition.js`
3. Restart server

**Monitoring:**
- Check console for `[RAG]` and `[VectorStore]` logs
- Monitor retrieval scores (should be >0.7 for good matches)
- Review generated diet plans for knowledge base alignment

## Cost Estimation

- **One-time embedding:** ~$0.001 (for ~10KB text)
- **Per diet plan query:** ~$0.0001 (one embedding call)
- **Monthly (1000 diet plans):** ~$0.10 for embeddings

Negligible compared to LLM generation costs.
