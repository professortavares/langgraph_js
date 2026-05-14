import OpenAI from "openai";

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const LLM_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set. Please check your .env file.");
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey.startsWith("sk-")) {
  throw new Error(`Invalid OPENAI_API_KEY format. Expected to start with 'sk-', got: '${apiKey.substring(0, 10)}...'`);
}

const client = new OpenAI({ apiKey });

/**
 * Validates that the OpenAI API key is valid by making a test embedding call.
 * Provides specific error messages for common issues (401, quota exceeded, network).
 * @returns {Promise<boolean>} True if validation succeeds
 * @throws {Error} If API key is invalid, expired, or no credits available
 */
export async function validateOpenAIKey() {
  try {
    console.log(`   🔑 Validating OpenAI API key...`);
    console.log(`   📝 Key format: ${apiKey.substring(0, 20)}...${apiKey.substring(-10)}`);

    await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: "test",
    });

    console.log(`   ✓ OpenAI API key is valid`);
    console.log(`   ℹ️  Embedding model: ${EMBEDDING_MODEL}`);
    console.log(`   ℹ️  LLM model: ${LLM_MODEL}`);
    return true;
  } catch (error) {
    console.error(`   ❌ OpenAI API validation failed:`);
    console.error(`      Error: ${error.message}`);

    if (error.status === 401 || error.message.includes("401")) {
      console.error(`      → The API key is invalid or expired`);
      console.error(`      → Get a new key at: https://platform.openai.com/api/keys`);
    } else if (error.message.includes("Insufficient quota")) {
      console.error(`      → Your OpenAI account has insufficient quota/credits`);
      console.error(`      → Check billing at: https://platform.openai.com/account/billing/overview`);
    } else if (error.message.includes("Connection") || error.code === "ECONNREFUSED") {
      console.error(`      → Cannot connect to OpenAI API (network issue)`);
      console.error(`      → Check your internet connection`);
    }

    throw error;
  }
}

/**
 * Generates vector embedding for text using OpenAI's embedding model.
 * Embeddings are used for semantic similarity search in Qdrant.
 * @param {string} text - Text to embed (typically document content or question)
 * @returns {Promise<number[]>} Vector embedding array (1536 dimensions for text-embedding-3-small)
 * @throws {Error} If embedding API call fails
 */
export async function embedText(text) {
  const textPreview = text.substring(0, 50).replace(/\n/g, " ");
  const startTime = Date.now();

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    const duration = Date.now() - startTime;
    const embedding = response.data[0].embedding;
    console.log(`      [OpenAI Embeddings] Dimension: ${embedding.length}, Time: ${duration}ms, Text: "${textPreview}..."`);
    return embedding;
  } catch (error) {
    console.error(`      ❌ [OpenAI Embeddings] Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generates an answer using OpenAI's LLM based on retrieved documents.
 * System prompt constrains responses to use only provided documents.
 * @param {Object} params - Function parameters
 * @param {string} params.question - User's question
 * @param {Array<{title: string, content: string, score: number}>} params.retrievedDocs - Documents from Qdrant search
 * @returns {Promise<string>} Generated answer text
 * @throws {Error} If LLM API call fails
 */
export async function generateAnswerWithOpenAI({ question, retrievedDocs }) {
  const startTime = Date.now();
  const docsContext = retrievedDocs
    .map(
      (doc, idx) =>
        `${idx + 1}. **${doc.title}** (score: ${doc.score.toFixed(2)}):\n${doc.content}`
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions based exclusively on the provided documents.
If the documents do not contain sufficient information to answer the question, clearly state that the information is not available in the provided documents.
Do not make up or infer information that is not explicitly mentioned in the documents.`;

  const userPrompt = `Based on the following documents, answer the question:

Documents:
${docsContext}

Question: ${question}

Answer:`;

  try {
    console.log(`      [OpenAI LLM] Model: ${LLM_MODEL}`);
    console.log(`      [OpenAI LLM] Context docs: ${retrievedDocs.length}`);
    console.log(`      [OpenAI LLM] Prompt length: ${userPrompt.length} chars`);
    console.log(`      [OpenAI LLM] ⏳ Sending request...`);

    const response = await client.chat.completions.create({
      model: LLM_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const duration = Date.now() - startTime;
    const answer = response.choices[0].message.content;
    console.log(`      [OpenAI LLM] ✓ Response received in ${duration}ms`);
    console.log(`      [OpenAI LLM] Response length: ${answer.length} chars`);
    console.log(`      [OpenAI LLM] Tokens used: ${response.usage?.completion_tokens || "N/A"}`);

    return answer;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`      ❌ [OpenAI LLM] Failed after ${duration}ms: ${error.message}`);
    throw error;
  }
}
