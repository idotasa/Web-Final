import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";
import { specs, swaggerUi } from "./swagger";

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
                const app = express();
                app.use(express.json());

                app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

                app.use("/auth", authRoutes);
                app.use("/post", postRoutes);
                app.use("/comment", commentRoutes);
                app.use("/user", userRoutes);

                resolve(app);
            })
            .catch(reject);
    });
};

export default initApp;
