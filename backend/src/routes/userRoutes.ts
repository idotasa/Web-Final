import express from "express";
const router = express.Router();
import userController from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";

router.get("/:id", userController.getById.bind(userController));
router.put("/:id", authMiddleware, userController.put.bind(userController));
router.delete("/:id", authMiddleware, userController.delete.bind(userController));

router.put("/:id/follow", authMiddleware, userController.toggleFollow.bind(userController));
router.get("/:id/followers", (req, res) => userController.getRelated(req, res, "followers"));
router.get("/:id/following", (req, res) => userController.getRelated(req, res, "following"));

export default router;
