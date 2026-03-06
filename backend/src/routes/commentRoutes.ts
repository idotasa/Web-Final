import express from "express";
const router = express.Router();
import commentController from "../controllers/commentController";
import authMiddleware from "../middleware/authMiddleware";

router.get("/", commentController.get.bind(commentController));
router.get("/:id", commentController.getById.bind(commentController));
router.post("/", authMiddleware, commentController.post.bind(commentController));
router.put("/:id", authMiddleware, commentController.put.bind(commentController));
router.delete("/:id", authMiddleware, commentController.delete.bind(commentController));

export default router;
