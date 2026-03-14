import { Request, Response } from "express";
import Comment from "../models/commentModel";
import BaseController from "./baseController";
import { IComment } from "../models/commentModel";

class CommentController extends BaseController<IComment> {
    constructor() {
        super(Comment, "owner", null);
    }

    async get(req: Request, res: Response): Promise<void> {
        try {
            const { page, limit, ...filter } = req.query;
            const query = Comment.find(filter).populate("owner", "username imgUrl").sort({ createdAt: -1 });

            if (page && limit) {
                const pag = this.parsePagination(req);
                const total = await Comment.countDocuments(filter);
                const data = await query.skip(pag.skip).limit(pag.limit).lean();
                res.json(this.paginatedResponse(data, pag.page, pag.limit, total));
            } else {
                const data = await query.lean();
                res.json(data);
            }
        } catch (error) {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
}

export default new CommentController();
