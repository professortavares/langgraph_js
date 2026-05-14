import { StateGraph } from "@langchain/langgraph";
import { embedText, generateAnswerWithOpenAI } from "./openai.js";
import { searchSimilar } from "./qdrant.js";

/**
 * Retrieval node: embeds the question and searches Qdrant for similar documents.
 * This is the first step of the RAG pipeline - finding relevant context.
 * @param {Object} state - Current graph state containing question, retrievedDocs, answer
 * @returns {Promise<Object>} Updated state with retrievedDocs populated
 */
async function retrieve(state) {
  const startTime = Date.now();
  console.log("\n🔍 [RETRIEVE NODE]");
  console.log(`   Input: "${state.question}"`);

  try {
    console.log(`   ⏳ Generating embedding for question...`);
    const questionEmbedding = await embedText(state.question);
    console.log(`   ✓ Embedding generated (dimension: ${questionEmbedding.length})`);

    console.log(`   ⏳ Searching Qdrant for similar documents (limit: 3)...`);
    const docs = await searchSimilar(questionEmbedding, 3);

    console.log(`   ✓ Found ${docs.length} documents:`);
    docs.forEach((doc, idx) => {
      console.log(`     ${idx + 1}. "${doc.title}" (score: ${doc.score.toFixed(4)})`);
      console.log(`        Content preview: ${doc.content.substring(0, 60)}...`);
    });

    const duration = Date.now() - startTime;
    console.log(`   ⏱️  Node completed in ${duration}ms`);

    return {
      question: state.question,
      retrievedDocs: docs,
      answer: state.answer,
    };
  } catch (error) {
    console.error(`   ❌ Error in retrieve node: ${error.message}`);
    throw error;
  }
}

/**
 * Answer generation node: generates answer using retrieved documents and LLM.
 * This is the second step of the RAG pipeline - synthesizing the answer.
 * @param {Object} state - Current graph state with question and retrievedDocs
 * @returns {Promise<Object>} Updated state with answer populated
 */
async function generateAnswer(state) {
  const startTime = Date.now();
  console.log("\n💭 [GENERATE ANSWER NODE]");
  console.log(`   Input question: "${state.question}"`);
  console.log(`   Using ${state.retrievedDocs.length} retrieved documents`);

  try {
    console.log(`   ⏳ Calling OpenAI LLM to generate answer...`);
    const answer = await generateAnswerWithOpenAI({
      question: state.question,
      retrievedDocs: state.retrievedDocs,
    });

    console.log(`   ✓ Answer generated (length: ${answer.length} chars)`);
    console.log(`   📄 Answer preview: ${answer.substring(0, 100)}...`);

    const duration = Date.now() - startTime;
    console.log(`   ⏱️  Node completed in ${duration}ms`);

    return {
      question: state.question,
      retrievedDocs: state.retrievedDocs,
      answer,
    };
  } catch (error) {
    console.error(`   ❌ Error in generateAnswer node: ${error.message}`);
    throw error;
  }
}

/**
 * Executes the RAG (Retrieval Augmented Generation) workflow.
 * Orchestrates the two-node pipeline:
 * 1. retrieve: Find relevant documents using semantic search
 * 2. generateAnswer: Generate answer using retrieved context
 *
 * @param {string} question - User's question to answer
 * @returns {Promise<Object>} Final state with question, retrievedDocs, and answer
 * @throws {Error} If either node fails (embedding, search, or LLM call)
 */
export async function runRagGraph(question) {
  console.log("\n" + "═".repeat(70));
  console.log("🚀 STARTING RAG GRAPH EXECUTION");
  console.log("═".repeat(70));
  const graphStartTime = Date.now();

  const workflow = new StateGraph({
    channels: {
      question: {
        value: null,
      },
      retrievedDocs: {
        value: null,
      },
      answer: {
        value: null,
      },
    },
  });

  workflow.addNode("retrieve", retrieve);
  workflow.addNode("generateAnswer", generateAnswer);

  workflow.setEntryPoint("retrieve");
  workflow.addEdge("retrieve", "generateAnswer");
  workflow.setFinishPoint("generateAnswer");

  const app = workflow.compile();

  console.log("\n📋 Graph Configuration:");
  console.log("   Entry Point: retrieve");
  console.log("   Flow: retrieve → generateAnswer");
  console.log("   Exit Point: generateAnswer");

  const result = await app.invoke({
    question,
    retrievedDocs: [],
    answer: "",
  });

  const totalDuration = Date.now() - graphStartTime;
  console.log("\n" + "═".repeat(70));
  console.log("✅ GRAPH EXECUTION COMPLETED");
  console.log(`⏱️  Total execution time: ${totalDuration}ms`);
  console.log("═".repeat(70));

  return result;
}
