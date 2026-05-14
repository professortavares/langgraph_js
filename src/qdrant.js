import { QdrantClient } from "@qdrant/qdrant-js";

const COLLECTION_NAME = "demo_rag_documents";
const VECTOR_SIZE = 1536;
const DISTANCE_METRIC = "Cosine";

let client = null;

export function getQdrantClient() {
  if (!client) {
    const url = process.env.QDRANT_URL || "http://localhost:6333";
    client = new QdrantClient({ url });
  }
  return client;
}

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

export async function recreateCollection() {
  console.log("\n   📦 [Qdrant] Preparing collection...");
  await waitForQdrant();
  const qdrant = getQdrantClient();

  try {
    console.log(`   🗑️  Deleting existing collection: ${COLLECTION_NAME}`);
    await qdrant.deleteCollection(COLLECTION_NAME);
    console.log(`   ✓ Collection deleted`);
  } catch (error) {
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
