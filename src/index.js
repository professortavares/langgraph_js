import "dotenv/config";
import { seedDocuments } from "./seed.js";
import { runRagGraph } from "./graph.js";

const DEFAULT_QUESTION = "Qual é a política de reembolso?";

async function main() {
  const appStartTime = Date.now();
  const question = process.argv[2] || DEFAULT_QUESTION;

  console.log("\n" + "╔".padEnd(71, "═") + "╗");
  console.log("║" + " RAG APPLICATION STARTED ".padStart(50).padEnd(70) + "║");
  console.log("╠" + "═".repeat(69) + "╣");
  console.log("║ Input Question:".padEnd(35) + question.substring(0, 34).padEnd(35) + "║");
  if (question.length > 34) {
    console.log("║ " + question.substring(34, 69).padEnd(69) + "║");
  }
  console.log("╚" + "═".repeat(69) + "╝");

  try {
    await seedDocuments();

    const result = await runRagGraph(question);

    console.log("\n" + "╔".padEnd(71, "═") + "╗");
    console.log("║" + " FINAL RESULTS ".padStart(48).padEnd(70) + "║");
    console.log("╚" + "═".repeat(69) + "╝");

    console.log("\n" + "─".repeat(70));
    console.log("❓ QUESTION");
    console.log("─".repeat(70));
    console.log(`${question}\n`);

    console.log("─".repeat(70));
    console.log(`📚 RETRIEVED DOCUMENTS (${result.retrievedDocs.length} total)`);
    console.log("─".repeat(70));
    result.retrievedDocs.forEach((doc, idx) => {
      console.log(`\n${idx + 1}. 📄 ${doc.title}`);
      console.log(`   Similarity Score: ${doc.score.toFixed(4)}`);
      console.log(`   Content Preview:`);
      const contentLines = doc.content.split("\n");
      contentLines.forEach((line) => {
        if (line.trim()) {
          console.log(`     ${line.substring(0, 66)}`);
        }
      });
    });

    console.log("\n" + "─".repeat(70));
    console.log("💡 GENERATED ANSWER");
    console.log("─".repeat(70));
    console.log(`\n${result.answer}\n`);

    const totalDuration = Date.now() - appStartTime;
    console.log("─".repeat(70));
    console.log("📊 PERFORMANCE METRICS");
    console.log("─".repeat(70));
    console.log(`Total Application Time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log("─".repeat(70) + "\n");
  } catch (error) {
    console.error("\n" + "╔".padEnd(71, "═") + "╗");
    console.error("║" + " ERROR OCCURRED ".padStart(48).padEnd(70) + "║");
    console.error("╚" + "═".repeat(69) + "╝\n");
    console.error(`❌ Error: ${error.message}`);

    if (error.message.includes("OPENAI_API_KEY")) {
      console.error("\n💡 Solution:");
      console.error("   1. Get your OpenAI API key from: https://platform.openai.com/api/keys");
      console.error("   2. Add it to your .env file:");
      console.error("      OPENAI_API_KEY=sk-proj-your_key_here");
      console.error("   3. Save and try again");
    } else if (error.message.includes("Connection error") || error.message.includes("401")) {
      console.error("\n💡 Solution:");
      console.error("   Check that your OPENAI_API_KEY is valid in the .env file");
      console.error("   Verify you have available credits at: https://platform.openai.com/account/billing/overview");
    } else if (error.message.includes("Failed to connect to Qdrant")) {
      console.error("\n💡 Solution:");
      console.error("   Make sure Qdrant is running:");
      console.error("   docker compose up --build");
    }

    console.error("\n" + "─".repeat(70) + "\n");
    process.exit(1);
  }
}

main();
