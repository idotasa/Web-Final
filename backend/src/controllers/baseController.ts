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

    protected parsePagination(req: Request) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        return { page, limit, skip };
    }

    protected paginatedResponse(data: any[], page: number, limit: number, total: number) {
        return { data, page, totalPages: Math.ceil(total / limit), total };
    }

    private applyExclude(query: any) {
        return this.excludeFields ? query.select(this.excludeFields) : query;
    }

    async get(req: Request, res: Response): Promise<void> {
        try {
            const { page, limit, ...filter } = req.query;

            if (page && limit) {
                const pag = this.parsePagination(req);
                const total = await this.model.countDocuments(filter);
                const data = await this.applyExclude(
                    this.model.find(filter).skip(pag.skip).limit(pag.limit).sort({ createdAt: -1 })
                );
                res.json(this.paginatedResponse(data, pag.page, pag.limit, total));
            } else {
                const data = await this.applyExclude(
                    this.model.find(filter).sort({ createdAt: -1 })
                );
                res.json(data);
            }
        } catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.applyExclude(this.model.findById(req.params.id));
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
            const data = await this.applyExclude(
                this.model.findByIdAndUpdate(req.params.id, req.body, { new: true })
            );
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
