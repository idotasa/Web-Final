import { Response } from "express";
import User from "../models/userModel";
import Post from "../models/postModel";
import BaseController from "./baseController";
import { AuthRequest } from "../middleware/authMiddleware";
import { IUser } from "../models/userModel";

class UserController extends BaseController<IUser> {
    constructor() {
        super(User, "_id", "-password -refreshTokens");
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        if (req.params.id !== req.user?._id) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        try {
            await Post.deleteMany({ owner: req.params.id });
            await this.model.findByIdAndDelete(req.params.id);
            res.json({ message: "User deleted" });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete user" });
        }
    }
}

export default new UserController();
