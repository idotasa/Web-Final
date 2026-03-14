import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";
import { specs, swaggerUi } from "./swagger";
import upload from "./middleware/uploadMiddleware";

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
                app.use(cors({ origin: "http://localhost:5173" }));
                app.use(express.json());

                // Serve uploaded files from the public/ directory
                app.use(express.static(path.join(process.cwd(), "public")));

                // File upload endpoint — public (no auth) so signup can upload avatars
                app.post("/file", upload.single("file"), (req, res) => {
                    if (!req.file) {
                        res.status(400).json({ error: "No file uploaded" });
                        return;
                    }
                    const domainBase = process.env.DOMAIN_BASE || `http://localhost:${process.env.PORT || 3000}`;
                    const url = `${domainBase}/${req.file.filename}`;
                    res.json({ url });
                });

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
