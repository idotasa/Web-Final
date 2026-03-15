import mongoose from "mongoose";

/**
 * Ensures the vector_index search index exists on the rag_chunks collection.
 * Uses MongoDB Atlas createSearchIndex (Lecture 08 convention).
 * Called once on server startup after mongoose.connect().
 */
export async function ensureVectorSearchIndex(): Promise<void> {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            console.warn("[VectorIndex] No database connection — skipping index creation.");
            return;
        }

        const collection = db.collection("rag_chunks");

        // Check if vector_index already exists
        const existingIndexes = await collection.listSearchIndexes().toArray();
        const hasIndex = existingIndexes.some((idx: any) => idx.name === "vector_index");

        if (hasIndex) {
            return;
        }

        // Create the vector search index programmatically
        await collection.createSearchIndex({
            name: "vector_index",
            type: "vectorSearch",
            definition: {
                fields: [
                    {
                        type: "vector",
                        path: "embedding",
                        numDimensions: 384,
                        similarity: "cosine",
                    },
                    { type: "filter", path: "metadata.senderId" },
                    { type: "filter", path: "metadata.category" },
                    { type: "filter", path: "metadata.timestamp" },
                ],
            },
        });

        console.log("[VectorIndex] Created 'vector_index' on rag_chunks collection.");
    } catch (err: any) {
        // Atlas free-tier or local Mongo may not support createSearchIndex
        // Log and continue — the app should still work for non-search features
        if (err.codeName === "CommandNotSupported" || err.code === 59) {
            console.warn("[VectorIndex] createSearchIndex not supported on this cluster. Create the index manually via Atlas UI.");
        } else {
            console.error("[VectorIndex] Failed to create vector search index:", err.message);
        }
    }
}
