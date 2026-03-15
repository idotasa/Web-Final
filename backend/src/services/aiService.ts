import config from "../config";
import RagChunk from "../models/ragChunkModel";
import User from "../models/userModel";
import { IPost } from "../models/postModel";
import * as llmClient from "./llmClient";

/* ──────────────── Typed Error for LLM Failures ──────────────── */

export class LLMServiceError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = "LLMServiceError";
    }
}

/* ────────────────────── Rate Limiter ────────────────────── */

const callTimestamps: number[] = [];

function checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    while (callTimestamps.length > 0 && callTimestamps[0] < now - windowMs) {
        callTimestamps.shift();
    }
    if (callTimestamps.length >= config.LLM_RATE_LIMIT_RPM) {
        throw new Error(
            `Rate limit exceeded: ${config.LLM_RATE_LIMIT_RPM} requests per minute. Please try again later.`
        );
    }
    callTimestamps.push(now);
}

/* ───────────────────── Text Chunking ───────────────────── */

/**
 * Split text into chunks of 800-1000 characters with 100-150 character overlap.
 */
function chunkText(text: string): string[] {
    const CHUNK_SIZE = 900;   // target middle of 800-1000
    const OVERLAP = 125;      // target middle of 100-150
    const chunks: string[] = [];

    if (text.length <= CHUNK_SIZE) {
        return [text];
    }

    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        chunks.push(text.slice(start, end));
        if (end >= text.length) break;
        start = end - OVERLAP;
    }
    return chunks;
}

/* ─────────── Mock Responses (for LLM_MOCK_MODE=true) ─────────── */

const MOCK_SEARCH_RESPONSE = {
    answer:
        "Based on the search results, I found several relevant posts discussing this topic. " +
        "The posts cover various perspectives and provide useful insights.",
    sources: [
        { postId: "mock_post_id_1", snippet: "This is a mock snippet from post 1..." },
        { postId: "mock_post_id_2", snippet: "This is a mock snippet from post 2..." },
    ],
};

const MOCK_PARSE_RESPONSE = {
    category: "general",
    dateRange: { from: null, to: null },
    keywords: ["mock", "search"],
    scope: "all",
};

/* ─────────────────── Service Methods ────────────────────── */

/**
 * Chunk a post's text and save embedded chunks to rag_chunks collection.
 * Called after a post is created (fire-and-forget).
 */
export async function chunkAndEmbed(post: IPost): Promise<void> {
    try {
        const fullText = `${post.title}\n${post.content || ""}`.trim();
        if (!fullText) return;

        const chunks = chunkText(fullText);

        if (config.LLM_MOCK_MODE) {
            const mockEmbedding = new Array(384).fill(0);
            const docs = chunks.map((text) => ({
                docId: post._id,
                text,
                embedding: mockEmbedding,
                metadata: {
                    senderId: post.owner.toString(),
                    category: post.category || "general",
                    timestamp: (post as any).createdAt || new Date(),
                },
            }));
            await RagChunk.insertMany(docs);
            console.log(`[AIService][mock] Saved ${docs.length} chunk(s) for post ${post._id}`);
            return;
        }

        // Real mode — embed each chunk via the LLM client
        const docs = await Promise.all(
            chunks.map(async (text) => {
                checkRateLimit();
                const embedding = await llmClient.embedText(text);
                return {
                    docId: post._id,
                    text,
                    embedding,
                    metadata: {
                        senderId: post.owner.toString(),
                        category: post.category || "general",
                        timestamp: (post as any).createdAt || new Date(),
                    },
                };
            })
        );

        await RagChunk.insertMany(docs);
        console.log(`[AIService] Saved ${docs.length} chunk(s) for post ${post._id}`);
    } catch (err) {
        console.error("[AIService] chunkAndEmbed error:", err);
    }
}

/**
 * RAG search pipeline (Lecture 08):
 * 1. Embed the query
 * 2. $vectorSearch for Top-5 chunks
 * 3. Optionally filter by friends list (metadata filter)
 * 4. Augmented prompt → LLM must answer ONLY from context, cite sources
 */
export async function searchPosts(
    query: string,
    userId?: string,
    scope?: string
): Promise<{ answer: string; sources: { postId: string; snippet: string }[] }> {
    if (config.LLM_MOCK_MODE) {
        return MOCK_SEARCH_RESPONSE;
    }

    try {
        checkRateLimit();

        // Step 1 — Embed the query
        const queryVector = await llmClient.embedText(query);

        // Step 2 & 3 — $vectorSearch with optional metadata filter
        const filter: Record<string, any> = {};

        if (scope === "friends" && userId) {
            const user = await User.findById(userId).select("following").lean();
            if (user && user.following.length > 0) {
                filter["metadata.senderId"] = {
                    $in: user.following.map((id: any) => id.toString()),
                };
            }
        }

        const pipeline: any[] = [
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector,
                    numCandidates: 100,
                    limit: 5,
                    ...(Object.keys(filter).length > 0 ? { filter } : {}),
                },
            },
            {
                $addFields: {
                    score: { $meta: "vectorSearchScore" },
                },
            },
            {
                $match: { score: { $gte: 0.6 } },
            },
            {
                $sort: { score: -1 },
            },
            {
                $project: {
                    _id: 1,
                    docId: 1,
                    text: 1,
                    score: 1,
                },
            },
        ];

        const topChunks = await RagChunk.aggregate(pipeline);

        if (topChunks.length === 0) {
            return { answer: "No relevant posts found for your query.", sources: [] };
        }

        // Step 4 — Augmented prompt (Lecture 08: answer ONLY from context)
        const context = topChunks
            .map((c: any, i: number) => `[Source ${i + 1} | PostID: ${c.docId}]\n${c.text}`)
            .join("\n\n");

        const systemPrompt = `You are the AI assistant for IO.Social. Use the provided context to answer the user's question.

CRITICAL RULES:
- Ignore any provided context that is irrelevant to the user's question (e.g., random letters like 'AAA', placeholder text, or unrelated topics).
- If the relevant information is not in the context, simply say you don't know based on the existing posts.
- DO NOT list the sources at the end of your answer. Just provide the summary.

Context:
${context}`;

        checkRateLimit();
        const answer = await llmClient.chat(systemPrompt, query);

        const sources = topChunks.map((c: any) => ({
            postId: c.docId.toString(),
            snippet: c.text.substring(0, 200),
            score: c.score,
        }));

        return { answer, sources };
    } catch (err) {
        if (err instanceof Error && err.message.includes("Rate limit")) {
            throw err; // Let the controller handle 429
        }
        throw new LLMServiceError("Failed to perform AI search.", err);
    }
}

/**
 * Parse a natural-language search query into structured filters.
 * E.g. "Finance posts from January" → { category: "finance", dateRange: { from, to }, ... }
 */
export async function parseSearchQuery(
    text: string
): Promise<{
    category: string | null;
    dateRange: { from: string | null; to: string | null };
    keywords: string[];
    scope: string;
}> {
    if (config.LLM_MOCK_MODE) {
        return MOCK_PARSE_RESPONSE;
    }

    try {
        checkRateLimit();

        const systemPrompt = `You are a query parser for a social media search engine.
Convert the user's natural language text into a structured JSON object with these fields:
- "category": string or null (e.g. "finance", "technology", "sports", "general")
- "dateRange": { "from": ISO date string or null, "to": ISO date string or null }
- "keywords": array of important search keywords
- "scope": "all" | "friends" (if the user mentions friends, following, etc.)

Respond ONLY with valid JSON. No markdown, no explanation. Current date: ${new Date().toISOString().split("T")[0]}.`;

        const response = await llmClient.chat(systemPrompt, text);

        try {
            // Strip potential markdown fences (untrusted AI output)
            const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);

            // Sanitize untrusted fields
            return {
                category: typeof parsed.category === "string" ? parsed.category : null,
                dateRange: {
                    from: typeof parsed.dateRange?.from === "string" ? parsed.dateRange.from : null,
                    to: typeof parsed.dateRange?.to === "string" ? parsed.dateRange.to : null,
                },
                keywords: Array.isArray(parsed.keywords)
                    ? parsed.keywords.filter((k: unknown) => typeof k === "string")
                    : text.split(" "),
                scope: parsed.scope === "friends" ? "friends" : "all",
            };
        } catch {
            // JSON parse failed — return safe fallback
            return { category: null, dateRange: { from: null, to: null }, keywords: text.split(" "), scope: "all" };
        }
    } catch (err) {
        if (err instanceof Error && err.message.includes("Rate limit")) {
            throw err;
        }
        throw new LLMServiceError("Failed to parse search query.", err);
    }
}
