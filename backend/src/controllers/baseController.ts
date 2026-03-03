import { Request, Response } from "express";
import { Model, Document } from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";

class BaseController<T extends Document> {
    model: Model<T>;
    ownerField: string | null;
    excludeFields: string | null;

    constructor(model: Model<T>, ownerField: string | null = null, excludeFields: string | null = null) {
        this.model = model;
        this.ownerField = ownerField;
        this.excludeFields = excludeFields;
    }

    async get(req: Request, res: Response): Promise<void> {
        try {
            const data = this.excludeFields
                ? await this.model.find(req.query).select(this.excludeFields)
                : await this.model.find(req.query);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const data = this.excludeFields
                ? await this.model.findById(req.params.id).select(this.excludeFields)
                : await this.model.findById(req.params.id);
            if (!data) {
                res.status(404).json({ error: "Not found" });
                return;
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async post(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (this.ownerField) {
                req.body[this.ownerField] = req.user?._id;
            }
            const data = await this.model.create(req.body);
            res.status(201).json(data);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async put(req: AuthRequest, res: Response): Promise<void> {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                res.status(404).json({ error: "Not found" });
                return;
            }
            if (this.ownerField && (item as any)[this.ownerField].toString() !== req.user?._id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            const data = this.excludeFields
                ? await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true }).select(this.excludeFields)
                : await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                res.status(404).json({ error: "Not found" });
                return;
            }
            if (this.ownerField && (item as any)[this.ownerField].toString() !== req.user?._id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            await this.model.findByIdAndDelete(req.params.id);
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }
}

export default BaseController;
