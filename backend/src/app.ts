import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import mongoose from "mongoose";

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
                resolve(app);
            })
            .catch((err) => {
                console.error("Failed to connect to MongoDB:", err);
                reject(err);
            });
    });
};

export default initApp;
