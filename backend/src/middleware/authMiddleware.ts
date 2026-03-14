import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { user?: { _id: string } };

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as string;

    try {
        const decoded = jwt.verify(token, secret) as { _id: string };
        req.user = { _id: decoded._id };
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};

/** Sets req.user if a valid token is present; does not 401 if missing or invalid */
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as string;
    try {
        const decoded = jwt.verify(token, secret) as { _id: string };
        req.user = { _id: decoded._id };
    } catch {
        // leave req.user undefined
    }
    next();
};

export default authMiddleware;
