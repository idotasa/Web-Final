import mongoose, { Document, Schema } from "mongoose";

/**
 * RAG Chunk — stores embedded text chunks for vector search.
 *
 * Atlas vectorSearch index definition (create via Atlas UI → Search Indexes → JSON Editor):
 * {
 *   "fields": [
 *     {
 *       "type": "vector",
 *       "path": "embedding",
 *       "numDimensions": 384,
 *       "similarity": "cosine"
 *     },
 *     { "type": "filter", "path": "metadata.senderId" },
 *     { "type": "filter", "path": "metadata.category" },
 *     { "type": "filter", "path": "metadata.timestamp" }
 *   ]
 * }
 * Index name: "vector_index"
 */

export interface IRagChunkMetadata {
    senderId: string;
    category: string;
    timestamp: Date;
}

export interface IRagChunk extends Document {
    docId: mongoose.Types.ObjectId;
    text: string;
    embedding: number[];
    metadata: IRagChunkMetadata;
}

const ragChunkSchema = new Schema<IRagChunk>(
    {
        docId: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            required: true,
        },
        metadata: {
            senderId: { type: String, required: true },
            category: { type: String, default: "general" },
            timestamp: { type: Date, required: true },
        },
    },
    { timestamps: true }
);

const RagChunk = mongoose.model<IRagChunk>("RagChunk", ragChunkSchema, "rag_chunks");
export default RagChunk;
