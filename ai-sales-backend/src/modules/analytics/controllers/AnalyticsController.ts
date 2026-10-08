import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/AnalyticsService";

export class AnalyticsController {
    constructor(
        private readonly analyticsService = new AnalyticsService()
    ) {}

    getDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.analyticsService.getDashboardOverview();
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.campaignId || req.query.campaignId || "");
            const data = await this.analyticsService.getCampaignAnalytics(campaignId || undefined);
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const surveyId = String(req.params.surveyId || req.params.id || "");
            if (!surveyId) {
                return res.status(400).json({ success: false, message: "surveyId is required" });
            }
            const data = await this.analyticsService.getSurveyAnalytics(surveyId);
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getAgent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.analyticsService.getAgentAnalytics();
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getLead360 = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const leadId = String(req.params.leadId || req.params.id || "");
            if (!leadId) {
                return res.status(400).json({ success: false, message: "leadId is required" });
            }
            const data = await this.analyticsService.getLead360(leadId);
            return res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };
}
