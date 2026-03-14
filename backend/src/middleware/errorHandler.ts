import { NextFunction, Request, Response } from "express";
import config from "../config";

/**
 * Global error handler middleware.
 * Sanitizes errors for production by hiding stack traces.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    const status = err.status || 500;
    const message = err.message;

    const response: any = {
        error: message,
    };

    // Only include stack trace if not in production
    if (config.NODE_ENV !== "production") {
        response.stack = err.stack;
    }

    res.status(status).json(response);
};
