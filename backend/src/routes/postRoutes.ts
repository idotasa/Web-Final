import express from "express";
const router = express.Router();
import postController from "../controllers/postController";
import authMiddleware from "../middleware/authMiddleware";

router.get("/", postController.get.bind(postController));
router.get("/feed", authMiddleware, postController.feed.bind(postController));
router.get("/:id", postController.getById.bind(postController));
router.post("/", authMiddleware, postController.post.bind(postController));
router.put("/:id", authMiddleware, postController.put.bind(postController));
router.delete("/:id", authMiddleware, postController.delete.bind(postController));
router.put("/:id/like", authMiddleware, postController.like.bind(postController));

export default router;
