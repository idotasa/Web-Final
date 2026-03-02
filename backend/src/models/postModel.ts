import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
    title: string;
    content?: string;
    imgUrl?: string;
    owner: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
}

const postSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            default: "",
        },
        imgUrl: {
            type: String,
            default: "",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        likes: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: [],
        },
    },
    { timestamps: true }
);

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;
