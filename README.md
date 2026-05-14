# LangGraph RAG Demo

A simple, educational RAG (Retrieval Augmented Generation) application demonstrating semantic search with LLM-powered answer generation using LangGraph.js, Qdrant, and OpenAI.

## Overview

This project showcases a complete RAG pipeline:

```
Question → Embedding → Qdrant Search → Retrieved Docs → OpenAI LLM → Answer
```

The application:
1. Seeds a Qdrant vector database with sample documents
2. Converts user questions into embeddings
3. Retrieves semantically similar documents from Qdrant
4. Generates answers using OpenAI's LLM based on retrieved documents
5. Orchestrates this workflow using LangGraph

## Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose
- OpenAI API key

## Quick Start

### 1. Clone and Setup

```bash
cd langgraph_js
cp .env.example .env
```

### 2. Configure OpenAI API Key

Edit `.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=your_actual_key_here
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

This will:
- Start a Qdrant instance on port 6333
- Build and run the Node.js application
- Seed the database with documents
- Run with a default question

### 4. Query with a Custom Question

In another terminal:

```bash
docker compose run --rm app npm start -- "Qual é a política de reembolso?"
```

Or with an English question:

```bash
docker compose run --rm app npm start -- "What are the payment options?"
```

## Project Structure

```
.
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Node.js application container
├── package.json                # Dependencies and scripts
├── .env.example                # Environment variables template
├── README.md                   # This file
└── src/
    ├── index.js                # Entry point
    ├── graph.js                # LangGraph state machine
    ├── qdrant.js               # Vector database operations
    ├── openai.js               # OpenAI embeddings and LLM
    ├── seed.js                 # Document seeding
    └── documents.js            # Sample documents
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
OPENAI_API_KEY=your_key_here              # Required: Your OpenAI API key
OPENAI_MODEL=gpt-4.1-mini                 # LLM model (default: gpt-4.1-mini)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # Embedding model
QDRANT_URL=http://qdrant:6333             # Qdrant service URL (for Docker)
```

## Usage

### Running the Application

**With Docker Compose:**

```bash
# With default question
docker compose up --build

# With custom question
docker compose run --rm app npm start -- "Your question here"
```

**Local Development (requires Node.js 20+ and local Qdrant instance):**

```bash
npm install
npm start -- "Your question here"
```

Or watch mode:

```bash
npm run dev
```

### Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RAG Query
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pergunta:
Qual é a política de reembolso?

→ Node: retrieve
→ Node: generateAnswer

────────────────────────────────────────────────────────────────
📚 Documentos Recuperados:
────────────────────────────────────────────────────────────────

1. Política de Reembolso
   Score: 0.897
   Conteúdo: A Acme Corporation oferece uma política de reembolso de 30 dias. Qualquer cliente pode solicitar um reembolso total dentro de...

2. FAQ de Pagamentos
   Score: 0.742
   Conteúdo: Aceitamos cartões de crédito (Visa, Mastercard, American Express), PayPal, transferência bancária e criptomoedas. A maioria dos...

3. Termos de Serviço
   Score: 0.621
   Conteúdo: Ao usar a Acme, você concorda com nossos termos de serviço. A responsabilidade máxima é limitada ao valor pago nos últimos 12 meses...

────────────────────────────────────────────────────────────────
💡 Resposta:
────────────────────────────────────────────────────────────────

Com base nos documentos recuperados, a Acme oferece uma política de reembolso abrangente:

- Período de reembolso: 30 dias
- Tipo: Reembolso total para qualquer motivo
- Processo: Contate support@acme.com ou ligue para 1-800-ACME-HELP
- Prazo de processamento: 5-7 dias úteis após aprovação
```

## Development

### Adding Documents

Edit `src/documents.js` to add more documents:

```javascript
{
  id: "doc_008",
  title: "New Document",
  content: "Document content here...",
}
```

Then restart the application to re-seed.

### Modifying the LLM Prompt

Edit the `generateAnswerWithOpenAI` function in `src/openai.js` to change how the LLM generates answers.

### Testing with Qdrant Dashboard

When running locally, access the Qdrant dashboard:

```
http://localhost:6333/dashboard
```

This allows you to inspect collections, vectors, and payloads.

## Architecture

### State Graph

The LangGraph workflow maintains state with three fields:

```javascript
{
  question: string,        // User's input question
  retrievedDocs: Array,    // Documents from Qdrant
  answer: string           // Generated answer
}
```

### Nodes

1. **retrieve** - Embeds the question and searches Qdrant for similar documents
2. **generateAnswer** - Generates an answer using OpenAI's LLM based on retrieved documents

### Flow

```
START → retrieve → generateAnswer → END
```

## Stack

- **Language**: JavaScript (ESM modules)
- **Graph Orchestration**: LangGraph.js (@langchain/langgraph)
- **Vector Database**: Qdrant (local, Docker)
- **Embeddings & LLM**: OpenAI
- **Runtime**: Node.js 20+
- **Infrastructure**: Docker & Docker Compose

## Implementation Notes

- Documents are embedded once during seeding using `text-embedding-3-small`
- Questions are embedded at query time with the same model for consistency
- Qdrant uses Cosine distance metric (vector dimension: 1536)
- No persistent storage—data is ephemeral (lost on container recreation)
- Supports multiple question languages (Portuguese, English, etc.)

## Troubleshooting

**Qdrant connection fails:**
- Ensure the Qdrant container is running: `docker compose ps`
- Check Qdrant health: `curl http://localhost:6333/health`

**OpenAI API errors:**
- Verify your API key is correct in `.env`
- Check your OpenAI account has available credits
- Monitor API usage at https://platform.openai.com/usage

**Module not found errors:**
- Run `npm install` in the container: `docker compose run --rm app npm install`

## License

MIT

## References

- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Node.js SDK](https://github.com/openai/node-sdk)
