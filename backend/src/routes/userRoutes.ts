import express from "express";
const router = express.Router();
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

router.get("/:id", userController.getById.bind(userController));
router.put("/:id", authMiddleware, userController.put.bind(userController));
router.delete("/:id", authMiddleware, userController.delete.bind(userController));

export default router;
