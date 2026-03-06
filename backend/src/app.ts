import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";

const initApp = (): Promise<Express> => {
    return new Promise<Express>((resolve, reject) => {
        const dbUri = process.env.MONGODB_URI;
        if (!dbUri) {
            reject(new Error("MONGODB_URI is not defined in environment variables"));
            return;
        }

        mongoose
            .connect(dbUri)
            .then(() => {
                console.log("Connected to MongoDB");
                const app = express();
                app.use(express.json());

                app.use("/auth", authRoutes);
                app.use("/post", postRoutes);
                app.use("/comment", commentRoutes);
                app.use("/user", userRoutes);

                resolve(app);
            })
            .catch((err) => {
                console.error("Failed to connect to MongoDB:", err);
                reject(err);
            });
    });
};

export default initApp;
