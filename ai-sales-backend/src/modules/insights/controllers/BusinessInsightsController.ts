import { Request, Response, NextFunction } from "express";
import { BusinessInsightsService } from "../services/BusinessInsightsService";

export class BusinessInsightsController {
    constructor(
        private readonly insightsService = new BusinessInsightsService()
    ) {}

    getInsights = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.insightsService.getInsights();
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    generate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.insightsService.generateInsights();
            return res.json({ success: true, message: "Insights generated successfully", data });
        } catch (error) {
            next(error);
        }
    };
}
