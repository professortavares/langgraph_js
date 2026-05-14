import { SAMPLE_DOCUMENTS } from "./documents.js";
import { embedText, validateOpenAIKey } from "./openai.js";
import { recreateCollection, upsertDocuments } from "./qdrant.js";

/**
 * Seeds the Qdrant vector database with sample documents.
 * This three-step process:
 * 1. Validates OpenAI API credentials
 * 2. Recreates the Qdrant collection for clean state
 * 3. Generates embeddings for all documents
 * 4. Upserts embeddings and metadata to Qdrant
 *
 * Called at application startup to ensure reproducible state.
 * @throws {Error} If API validation, Qdrant connection, or embedding fails
 */
export async function seedDocuments() {
  const seedStartTime = Date.now();
  console.log("\n" + "═".repeat(70));
  console.log("🌱 STARTING DOCUMENT SEEDING");
  console.log("═".repeat(70));

  console.log("\n[Pre-flight checks]");
  await validateOpenAIKey();

  console.log("\n📚 Configuration:");
  console.log(`   Total documents to seed: ${SAMPLE_DOCUMENTS.length}`);
  SAMPLE_DOCUMENTS.forEach((doc, idx) => {
    console.log(`   ${idx + 1}. ${doc.title}`);
  });

  console.log("\n[Step 1/3] Recreating Qdrant collection...");
  const collectionStartTime = Date.now();
  await recreateCollection();
  const collectionDuration = Date.now() - collectionStartTime;
  console.log(`   ✓ Completed in ${collectionDuration}ms\n`);

  console.log("[Step 2/3] Generating embeddings for documents...");
  const embeddingStartTime = Date.now();
  console.log(`   ⏳ Processing ${SAMPLE_DOCUMENTS.length} documents...`);

  const documentsWithVectors = await Promise.all(
    SAMPLE_DOCUMENTS.map(async (doc, idx) => {
      console.log(`   [${idx + 1}/${SAMPLE_DOCUMENTS.length}] Embedding: ${doc.title}`);
      const vector = await embedText(doc.content);
      return {
        ...doc,
        vector,
      };
    })
  );

  const embeddingDuration = Date.now() - embeddingStartTime;
  console.log(`   ✓ All embeddings generated in ${embeddingDuration}ms\n`);

  console.log("[Step 3/3] Upserting documents to Qdrant...");
  const upsertStartTime = Date.now();
  await upsertDocuments(documentsWithVectors);
  const upsertDuration = Date.now() - upsertStartTime;
  console.log(`   ✓ Completed in ${upsertDuration}ms\n`);

  const totalDuration = Date.now() - seedStartTime;
  console.log("═".repeat(70));
  console.log("✅ SEEDING COMPLETED SUCCESSFULLY");
  console.log(`⏱️  Timeline:`);
  console.log(`   Collection setup: ${collectionDuration}ms`);
  console.log(`   Embeddings: ${embeddingDuration}ms`);
  console.log(`   Upsert to Qdrant: ${upsertDuration}ms`);
  console.log(`   Total time: ${totalDuration}ms`);
  console.log("═".repeat(70));
}
