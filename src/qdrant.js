import { QdrantClient } from "@qdrant/qdrant-js";

const COLLECTION_NAME = "demo_rag_documents";
const VECTOR_SIZE = 1536; // Dimension of text-embedding-3-small vectors
const DISTANCE_METRIC = "Cosine"; // Cosine similarity for semantic search

let client = null;

/**
 * Gets or initializes the Qdrant client (singleton pattern).
 * Connects to Qdrant at URL specified in QDRANT_URL env var.
 * @returns {QdrantClient} Initialized Qdrant client instance
 */
export function getQdrantClient() {
  if (!client) {
    const url = process.env.QDRANT_URL || "http://localhost:6333";
    client = new QdrantClient({ url });
  }
  return client;
}

/**
 * Waits for Qdrant to be available with exponential backoff retry logic.
 * Necessary because Qdrant container may take time to fully initialize.
 * @param {number} maxRetries - Maximum connection attempts
 * @param {number} delayMs - Initial delay between retries (increases per attempt)
 * @throws {Error} If unable to connect after all retries
 */
async function waitForQdrant(maxRetries = 5, delayMs = 1000) {
  let lastError;
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`   🔗 Qdrant connection attempt ${i + 1}/${maxRetries}...`);
      const qdrant = getQdrantClient();
      await qdrant.getCollections();
      console.log(`   ✓ Successfully connected to Qdrant at ${qdrantUrl}`);
      return;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.log(`   ⏳ Connection failed, waiting ${delayMs}ms before retry...`);
        console.log(`   📝 Error: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new Error(`Failed to connect to Qdrant at ${qdrantUrl} after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Deletes existing collection and creates a new empty one.
 * Called during document seeding to ensure clean state.
 * Collection stores vector embeddings with document metadata (title, content).
 * @throws {Error} If collection operations fail
 */
export async function recreateCollection() {
  console.log("\n   📦 [Qdrant] Preparing collection...");
  await waitForQdrant();
  const qdrant = getQdrantClient();

  try {
    console.log(`   🗑️  Deleting existing collection: ${COLLECTION_NAME}`);
    await qdrant.deleteCollection(COLLECTION_NAME);
    console.log(`   ✓ Collection deleted`);
  } catch (error) {
    // Ignore "not found" errors - collection may not exist yet
    if (!error.message.includes("not found")) {
      throw error;
    }
    console.log(`   ℹ️  Collection did not exist (creating new)`);
  }

  console.log(`   🔨 Creating new collection...`);
  console.log(`      Name: ${COLLECTION_NAME}`);
  console.log(`      Vector size: ${VECTOR_SIZE}`);
  console.log(`      Distance metric: ${DISTANCE_METRIC}`);

  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: {
      size: VECTOR_SIZE,
      distance: DISTANCE_METRIC,
    },
  });

  console.log(`   ✓ Collection created successfully`);
}

/**
 * Inserts documents with their vector embeddings into Qdrant.
 * Payload stores document metadata for retrieval.
 * @param {Array<{id: string, title: string, content: string, vector: number[]}>} documentsWithVectors
 * @throws {Error} If upsert operation fails
 */
export async function upsertDocuments(documentsWithVectors) {
  console.log(`\n   📥 [Qdrant] Upserting documents...`);
  const qdrant = getQdrantClient();

  const points = documentsWithVectors.map((doc, idx) => ({
    id: idx,
    vector: doc.vector,
    payload: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
    },
  }));

  console.log(`   📊 Preparing ${points.length} points for insertion:`);
  points.forEach((point, idx) => {
    console.log(`      ${idx + 1}. ID: ${point.id} | Vector dim: ${point.vector.length}`);
  });

  await qdrant.upsert(COLLECTION_NAME, {
    points,
  });

  console.log(`   ✓ Successfully upserted ${points.length} documents to Qdrant`);
}

/**
 * Searches for documents similar to the given vector using cosine similarity.
 * Returns top-k most similar documents with their similarity scores.
 * @param {number[]} vector - Query vector (typically from embedding a question)
 * @param {number} limit - Maximum number of documents to return (default: 3)
 * @returns {Promise<Array<{title: string, content: string, score: number}>>} Similar documents ranked by relevance
 * @throws {Error} If search operation fails
 */
export async function searchSimilar(vector, limit = 3) {
  console.log(`   🔎 [Qdrant] Searching for similar documents...`);
  console.log(`      Query vector dimension: ${vector.length}`);
  console.log(`      Limit: ${limit}`);
  console.log(`      Metric: ${DISTANCE_METRIC}`);

  const qdrant = getQdrantClient();

  const results = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit,
    with_payload: true,
  });

  console.log(`   ✓ Search returned ${results.length} results:`);
  results.forEach((result, idx) => {
    console.log(`      ${idx + 1}. Score: ${result.score.toFixed(4)} | Title: ${result.payload.title}`);
  });

  return results.map((result) => ({
    title: result.payload.title,
    content: result.payload.content,
    score: result.score,
  }));
}
