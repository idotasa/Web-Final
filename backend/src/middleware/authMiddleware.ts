import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export type AuthRequest = Request & { user?: { _id: string } };

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const secret = config.ACCESS_TOKEN_SECRET;

    try {
        const decoded = jwt.verify(token, secret) as { _id: string };
        req.user = { _id: decoded._id };
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};

export default authMiddleware;
