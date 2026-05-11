const { QdrantClient } = require("@qdrant/js-client-rest");

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

async function main() {
  try {
    const client = new QdrantClient({
      url: QDRANT_URL,
    });

    const collections = await client.getCollections();

    console.log("Connected to Qdrant successfully.");
    console.log("Qdrant URL:", QDRANT_URL);
    console.log("Collections:", collections);
  } catch (error) {
    console.error("Failed to connect to Qdrant.");
    console.error(error);
    process.exit(1);
  }
}

main();