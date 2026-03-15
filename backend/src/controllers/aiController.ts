import { Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { AuthRequest } from "../middleware/authMiddleware";
import * as aiService from "../services/aiService";

/* ───────────── Zod Validation Schemas ───────────── */

const searchSchema = z.object({
    query: z.string().min(1, "A 'query' string is required."),
    scope: z.enum(["all", "friends"]).optional().default("all"),
});

const parseSchema = z.object({
    text: z.string().min(1, "A 'text' string is required."),
});

/* ───── Response Validation (Untrusted AI Output) ───── */

const searchResponseSchema = z.object({
    answer: z.string(),
    sources: z.array(
        z.object({
            postId: z.string(),
            snippet: z.string(),
        })
    ),
});

const parseResponseSchema = z.object({
    category: z.string().nullable(),
    dateRange: z.object({
        from: z.string().nullable(),
        to: z.string().nullable(),
    }),
    keywords: z.array(z.string()),
    scope: z.enum(["all", "friends"]).default("all"),
});

/**
 * AI Controller — handles smart search and query parsing endpoints.
 * Follows Controller-Service-LLMClient architecture (Lecture 07):
 * - Input validation via Zod schemas
 * - Unique Request ID per request
 * - Error mapping: 400 validation, 429 rate-limit, 503 LLM failure
 * - AI output validated as untrusted data before returning
 */
class AIController {
    /**
     * POST /v1/ai/search
     */
    async search(req: AuthRequest, res: Response): Promise<void> {
        const requestId = crypto.randomUUID();
        res.setHeader("X-Request-Id", requestId);

        try {
            // Input validation (Zod)
            const parsed = searchSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    requestId,
                    error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
                });
                return;
            }

            const { query, scope } = parsed.data;
            const userId = req.user!._id;

            const rawResult = await aiService.searchPosts(query, userId, scope);

            // Validate untrusted AI output
            const validated = searchResponseSchema.safeParse(rawResult);
            if (!validated.success) {
                console.error(`[AIController][${requestId}] AI output validation failed:`, validated.error);
                res.status(503).json({
                    requestId,
                    error: "AI service returned an invalid response.",
                });
                return;
            }

            res.json({ requestId, ...validated.data });
        } catch (error) {
            this.handleError(res, error, requestId);
        }
    }

    /**
     * POST /v1/ai/search/parse
     */
    async parseQuery(req: AuthRequest, res: Response): Promise<void> {
        const requestId = crypto.randomUUID();
        res.setHeader("X-Request-Id", requestId);

        try {
            // Input validation (Zod)
            const parsed = parseSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    requestId,
                    error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
                });
                return;
            }

            const { text } = parsed.data;
            const rawResult = await aiService.parseSearchQuery(text);

            // Validate untrusted AI output
            const validated = parseResponseSchema.safeParse(rawResult);
            if (!validated.success) {
                console.error(`[AIController][${requestId}] AI output validation failed:`, validated.error);
                res.status(503).json({
                    requestId,
                    error: "AI service returned an invalid response.",
                });
                return;
            }

            res.json({ requestId, ...validated.data });
        } catch (error) {
            this.handleError(res, error, requestId);
        }
    }

    /**
     * Centralized error mapper: 429 rate-limit, 503 LLM failure, 500 fallback
     */
    private handleError(res: Response, error: unknown, requestId: string): void {
        const message = error instanceof Error ? error.message : "An unknown error occurred";

        if (message.includes("Rate limit")) {
            res.status(429).json({ requestId, error: message });
            return;
        }

        // LLM / service failures → 503
        if (
            error instanceof aiService.LLMServiceError ||
            message.includes("GEMINI") ||
            message.includes("model") ||
            message.includes("API")
        ) {
            res.status(503).json({ requestId, error: "AI service temporarily unavailable." });
            return;
        }

        res.status(500).json({ requestId, error: message });
    }
}

export default new AIController();
