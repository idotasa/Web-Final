import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
    content: string;
    postId: mongoose.Types.ObjectId;
    owner: mongoose.Types.ObjectId;
}

const commentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: true,
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
