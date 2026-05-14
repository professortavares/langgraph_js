# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **RAG (Retrieval Augmented Generation) application** built with LangGraph.js, Qdrant (vector database), and OpenAI. The project demonstrates a complete, runnable example of semantic search with LLM-powered answer generation.

The application:
1. Indexes documents in Qdrant (vector database)
2. Converts user questions to embeddings
3. Retrieves semantically similar documents from Qdrant
4. Uses OpenAI to generate answers based on retrieved documents
5. Orchestrates this workflow using LangGraph

## Tech Stack

- **Runtime**: Node.js 20+ (ESM modules)
- **Graph Orchestration**: `@langchain/langgraph` (StateGraph)
- **Vector Database**: Qdrant (local, via Docker)
- **Embeddings & LLM**: OpenAI (official SDK)
- **Infrastructure**: Docker & docker-compose
- **Package Manager**: npm

## Project Structure

```
.
├── docker-compose.yml      # Starts Qdrant and Node.js app
├── Dockerfile              # Node.js application container
├── package.json            # Dependencies and scripts
├── .env.example            # Environment variables template
├── README.md               # Usage and setup instructions
└── src/
    ├── index.js            # Entry point, orchestrates workflow
    ├── graph.js            # LangGraph state graph definition
    ├── qdrant.js           # Vector database operations
    ├── openai.js           # OpenAI embeddings and LLM calls
    ├── seed.js             # Document seeding and initialization
    └── documents.js        # Sample documents (5-8 documents)
```

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Copy environment template and add OPENAI_API_KEY
cp .env.example .env
```

### Local Development (with Docker)
```bash
# Build and start services (Qdrant + app)
docker compose up --build

# Run the RAG application with a question
docker compose run --rm app npm start -- "Your question here?"

# Example:
docker compose run --rm app npm start -- "Qual é a política de reembolso?"

# Watch mode for development
npm run dev
```

### Scripts in package.json
- `npm start [question]` — Run the RAG application; uses default question if none provided
- `npm run dev` — Run with `node --watch` for auto-reload during development

## Key Architecture Decisions

### State Graph
The LangGraph state machine contains:
- `question` (string) — User's input question
- `retrievedDocs` (array) — Documents from Qdrant with format: `{ title, content, score }`
- `answer` (string) — Final LLM-generated answer

### Graph Nodes
1. **retrieve** — Embeds the question and searches Qdrant for similar documents (limit configurable, typically 3-5 results)
2. **generateAnswer** — Constructs a prompt with question + retrieved docs, calls OpenAI LLM

### Flow
```
START → retrieve → generateAnswer → END
```

### Qdrant Collection
- **Name**: `demo_rag_documents`
- **Distance metric**: Cosine similarity
- **Vector dimension**: 1536 (for `text-embedding-3-small`)
- **Payload**: Stores `title` and `content` alongside vectors

### OpenAI Models
- **Embedding**: `text-embedding-3-small` (configurable via `OPENAI_EMBEDDING_MODEL`)
- **LLM**: `gpt-4.1-mini` (configurable via `OPENAI_MODEL`)

Both are settable as environment variables; update constants in `src/openai.js` for defaults.

## Common Tasks

### Adding or Modifying Documents
- Edit `src/documents.js` to add/remove documents (id, title, content)
- Rerun `docker compose up --build` to re-seed the collection

### Testing the Graph
- Modify `src/index.js` to test with different questions
- Use `docker compose run --rm app npm start -- "your question"` to run queries

### Debugging Qdrant
- Qdrant exposes a web UI at `http://localhost:6333/dashboard` when running via docker-compose
- Use this to inspect collections and stored documents

### Modifying the LLM Prompt
- Edit the system prompt in `src/openai.js` function `generateAnswerWithOpenAI()`
- The prompt instructs the LLM to answer only based on retrieved documents and admit if documents are insufficient

## Environment Setup

Required in `.env`:
```
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
QDRANT_URL=http://qdrant:6333
```

For Docker Compose, `QDRANT_URL` must use the service name `qdrant` (not localhost).

## Code Conventions

- **Language**: JavaScript (ESM modules, no TypeScript)
- **Async**: Use async/await throughout
- **Error Handling**: Handle Qdrant availability (with retries) and OpenAI API errors gracefully
- **Comments**: Only where intent is non-obvious (why, not what)
- **Simplicity**: Avoid over-engineering; prioritize clarity and directness

## Important Implementation Details

### Qdrant Connection & Retries
- `src/qdrant.js` should retry connecting to Qdrant a few times before giving up (useful during initial startup)
- Use exponential backoff or simple linear retries (e.g., 5 attempts, 1s delay each)

### Document Embedding
- Documents are embedded once during seed, stored in Qdrant
- Questions are embedded at query time using the same embedding model
- This ensures consistency between document and query vectors

### No Persistent Storage
- Qdrant does not use a volume in docker-compose (data is ephemeral)
- Each `docker compose up` starts with a fresh database
- Documents are re-seeded automatically on app startup

## Testing Approach

- No unit test framework included; focus on integration testing via docker-compose
- Verify the output is correct by inspecting console output
- Test with various questions to confirm retrieval and answer quality
- Check Qdrant dashboard to inspect stored documents and vector metadata

## References

- [LangGraph.js Docs](https://langchain-ai.github.io/langgraphjs/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [OpenAI Node.js SDK](https://github.com/openai/node-sdk)
