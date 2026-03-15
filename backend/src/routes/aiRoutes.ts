import express from "express";
const router = express.Router();
import aiController from "../controllers/aiController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered search and query parsing (RAG pipeline)
 */

/**
 * @swagger
 * /v1/ai/search:
 *   post:
 *     summary: Smart search across posts using AI (RAG pipeline)
 *     description: >
 *       Converts the query into a vector, searches the rag_chunks collection
 *       via $vectorSearch, then sends the top results to the LLM for a
 *       summarized answer with source citations.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "What are people saying about the stock market?"
 *               scope:
 *                 type: string
 *                 enum: [all, friends]
 *                 default: all
 *                 description: Limit results to posts from friends only
 *     responses:
 *       200:
 *         description: AI-generated summary with source citations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: string
 *                       snippet:
 *                         type: string
 *       400:
 *         description: Missing query parameter
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/search", authMiddleware, aiController.search.bind(aiController));

/**
 * @swagger
 * /v1/ai/search/parse:
 *   post:
 *     summary: Parse natural language into structured search filters
 *     description: >
 *       Converts ambiguous user text (e.g. "Finance posts from January")
 *       into a structured JSON with category, dateRange, keywords, and scope.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Finance posts from January"
 *     responses:
 *       200:
 *         description: Structured search filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   nullable: true
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       nullable: true
 *                     to:
 *                       type: string
 *                       nullable: true
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                 scope:
 *                   type: string
 *                   enum: [all, friends]
 *       400:
 *         description: Missing text parameter
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/search/parse", authMiddleware, aiController.parseQuery.bind(aiController));

export default router;
