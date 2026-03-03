import { Response } from "express";
import Post from "../models/postModel";
import Comment from "../models/commentModel";
import BaseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";
import { IPost } from "../models/postModel";

class PostController extends BaseController<IPost> {
    constructor() {
        super(Post, "owner");
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            if (post.owner.toString() !== req.user?._id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            await Comment.deleteMany({ postId: req.params.id });
            await Post.findByIdAndDelete(req.params.id);
            res.json(post);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async like(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            const alreadyLiked = post.likes.some((id) => id.toString() === userId);
            if (alreadyLiked) {
                post.likes = post.likes.filter((id) => id.toString() !== userId);
            } else {
                post.likes.push(userId as any);
            }
            await post.save();
            res.json({ likes: post.likes.length, isLiked: !alreadyLiked });
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }
}

export default new PostController();
