import express, { Express } from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";
import { specs, swaggerUi } from "./swagger";
import upload from "./middleware/uploadMiddleware";
import config from "./config";
import { errorHandler } from "./middleware/errorHandler";

const initApp = (): Promise<Express> => {
    return new Promise<Express>((resolve, reject) => {
        const dbUri = config.DB_URL;

        mongoose
            .connect(dbUri)
            .then(() => {
                const app = express();
                app.use(cors({ origin: config.CORS_ORIGIN }));
                app.use(express.json());

                // Serve uploaded files from the public/ directory
                app.use(express.static(path.join(process.cwd(), "public")));

                // File upload endpoint — public (no auth) so signup can upload avatars
                app.post("/file", upload.single("file"), (req, res) => {
                    if (!req.file) {
                        res.status(400).json({ error: "No file uploaded" });
                        return;
                    }
                    const url = `${config.DOMAIN_BASE}/uploads/${req.file.filename}`;
                    res.json({ url });
                });

                app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

                app.use("/auth", authRoutes);
                app.use("/post", postRoutes);
                app.use("/comment", commentRoutes);
                app.use("/user", userRoutes);

                // Global error handler (should be last)
                app.use(errorHandler);

                resolve(app);
            })
            .catch(reject);
    });
};

export default initApp;
