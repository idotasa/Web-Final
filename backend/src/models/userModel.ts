import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    password: string;
    username: string;
    imgUrl?: string;
    refreshTokens: string[];
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        imgUrl: {
            type: String,
            default: "",
        },
        refreshTokens: {
            type: [String],
            default: [],
        },
        followers: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: [],
        },
        following: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: [],
        },
    },
    { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
