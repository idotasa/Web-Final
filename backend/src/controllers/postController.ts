import { Response } from "express";
import Post from "../models/postModel";
import Comment from "../models/commentModel";
import User from "../models/userModel";
import BaseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";
import { IPost } from "../models/postModel";
import * as aiService from "../services/aiService";

class PostController extends BaseController<IPost> {
    constructor() {
        super(Post, "owner", null);
    }

    /**
     * Override base post() to trigger RAG chunking after creation.
     */
    async post(req: AuthRequest, res: Response): Promise<void> {
        try {
            req.body.owner = req.user?._id;
            const data = await Post.create(req.body);
            // Fire-and-forget: chunk and embed the new post for vector search
            aiService.chunkAndEmbed(data).catch((err) =>
                console.error("[PostController] chunkAndEmbed failed:", err)
            );
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }

    async feed(req: AuthRequest, res: Response): Promise<void> {
        try {
            const pag = this.parsePagination(req);
            const user = await User.findById(req.user!._id).select("following").lean();
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            const ownerIds = [...user.following.map((id: unknown) => id), req.user!._id];

            const posts = await Post.find({ owner: { $in: ownerIds } })
                .sort({ createdAt: -1 })
                .skip(pag.skip)
                .limit(pag.limit + 1)
                .populate("owner", "username imgUrl")
                .lean();

            const hasMore = posts.length > pag.limit;
            if (hasMore) posts.pop();

            const currentUserId = req.user!._id;
            const data = await Promise.all(
                posts.map(async (post) => ({
                    ...post,
                    likesCount: post.likes.length,
                    commentsCount: await Comment.countDocuments({ postId: post._id }),
                    isLiked: post.likes.some((id) => String(id) === currentUserId),
                }))
            );

            res.json({ data, page: pag.page, hasMore });
        } catch (error) {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            if (post.owner.toString() !== req.user!._id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            await Comment.deleteMany({ postId: req.params.id });
            await Post.findByIdAndDelete(req.params.id);
            res.json(post);
        } catch (error) {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }

    async like(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.user!._id;
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            const alreadyLiked = post.likes.some((id) => id.toString() === userId);

            if (alreadyLiked) {
                await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: userId } });
            } else {
                await Post.findByIdAndUpdate(req.params.id, { $addToSet: { likes: userId } });
            }

            const updatedPost = await Post.findById(req.params.id);
            res.json({ likes: updatedPost!.likes.length, isLiked: !alreadyLiked });
        } catch (error) {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
}

export default new PostController();
