import Comment from "../models/commentModel";
import BaseController from "./baseController";
import { IComment } from "../models/commentModel";

class CommentController extends BaseController<IComment> {
    constructor() {
        super(Comment, "owner");
    }
}

export default new CommentController();
