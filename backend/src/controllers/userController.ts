import { Request, Response } from "express";
import User from "../models/userModel";
import Post from "../models/postModel";
import BaseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";
import { IUser } from "../models/userModel";

class UserController extends BaseController<IUser> {
    constructor() {
        super(User, "_id", "-password -refreshTokens");
    }

    async search(req: Request, res: Response): Promise<void> {
        try {
            const q = req.query.q as string;
            if (!q) {
                res.status(400).json({ error: "Query parameter 'q' is required" });
                return;
            }
            const users = await User.find({ username: { $regex: q, $options: "i" } })
                .select("_id username imgUrl")
                .limit(10);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async toggleFollow(req: AuthRequest, res: Response): Promise<void> {
        const targetId = req.params.id;
        const myId = req.user!._id;
        if (targetId === myId) {
            res.status(400).json({ error: "Cannot follow yourself" });
            return;
        }
        try {
            const targetUser = await User.findById(targetId);
            if (!targetUser) {
                res.status(404).json({ error: "User not found" });
                return;
            }

            const isFollowing = targetUser.followers.some((id) => id.toString() === myId);

            if (isFollowing) {
                await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
                await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
            } else {
                await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
                await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
            }

            const updatedTarget = await User.findById(targetId);
            res.json({
                isFollowing: !isFollowing,
                followersCount: updatedTarget!.followers.length,
            });
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async getRelated(req: Request, res: Response, field: "followers" | "following"): Promise<void> {
        try {
            const user = await User.findById(req.params.id)
                .populate(field, "-password -refreshTokens");
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.json(user[field]);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        if (req.params.id !== req.user!._id) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        try {
            await Post.deleteMany({ owner: req.params.id });
            await User.updateMany(
                { $or: [{ followers: req.params.id }, { following: req.params.id }] },
                { $pull: { followers: req.params.id, following: req.params.id } }
            );
            await this.model.findByIdAndDelete(req.params.id);
            res.json({ message: "User deleted" });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete user" });
        }
    }
}

export default new UserController();
