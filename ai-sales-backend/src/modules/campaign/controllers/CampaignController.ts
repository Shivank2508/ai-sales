import { NextFunction, Request, Response } from "express";
import { CampaignService } from "../services/CampaignService";
import { CampaignExecutionService } from "../services/CampaignExecutionService";
import { AICampaignService } from "../services/AICampaignService";
import { LeadModel } from "../../leads/lead.model";
import { TwilioService } from "../../voice/twilio.service";

export class CampaignController {
    constructor(
        private readonly campaignService = new CampaignService(),
        private readonly executionService = new CampaignExecutionService(),
        private readonly aiCampaignService = new AICampaignService(),
        private readonly twilioService = new TwilioService()
    ) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaign = await this.campaignService.createCampaign({
                ...req.body,
                createdBy: (req as any).user?._id || req.body.createdBy,
            });

            return res.status(201).json({ success: true, data: campaign });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaigns = await this.campaignService.getAllCampaigns();
            return res.json({
                success: true,
                data: campaigns,
            });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.campaignService.getCampaign(campaignId);

            return res.json({
                success: true,
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    getByBusiness = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const businessId = String(req.params.businessId || "");
            const campaigns = await this.campaignService.getBusinessCampaigns(businessId);

            return res.json({
                success: true,
                data: campaigns,
            });
        } catch (err) {
            next(err);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.campaignService.updateCampaign(campaignId, req.body);
            return res.json({
                success: true,
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    publish = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.campaignService.publishCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign published successfully",
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    launch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const result = await this.executionService.launchCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign launched successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    };

    getLeads = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const leads = await this.executionService.getCampaignLeads(campaignId);

            return res.json({
                success: true,
                data: leads,
            });
        } catch (err) {
            next(err);
        }
    };

    pause = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.campaignService.pauseCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign paused successfully",
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    resume = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.executionService.resumeCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign resumed successfully",
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.executionService.cancelCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign cancelled successfully",
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    archive = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const campaign = await this.campaignService.archiveCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign archived successfully",
                data: campaign,
            });
        } catch (err) {
            next(err);
        }
    };

    generateAI = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { goal, productContext, productId, targetAudience, action, createLinkedSurvey, businessName } = req.body;
            if (!goal?.trim()) {
                return res.status(400).json({ success: false, message: "Campaign goal is required" });
            }

            const result = await this.aiCampaignService.generateCampaign({
                goal: goal.trim(),
                productContext,
                productId,
                targetAudience,
                action,
                createLinkedSurvey: createLinkedSurvey !== false,
                businessName,
            });

            return res.status(201).json({
                success: true,
                message: "AI Campaign created successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    editAI = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const { instructions } = req.body;
            if (!instructions?.trim()) {
                return res.status(400).json({ success: false, message: "Instructions are required for AI edit" });
            }

            const updated = await this.aiCampaignService.editCampaignWithAI(campaignId, instructions);
            return res.json({
                success: true,
                message: "Campaign updated via AI successfully",
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    addLeads = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const { leadIds } = req.body;
            if (!Array.isArray(leadIds) || leadIds.length === 0) {
                return res.status(400).json({ success: false, message: "leadIds array is required" });
            }

            const result = await this.aiCampaignService.addLeadsToCampaign(campaignId, leadIds);
            return res.json({
                success: true,
                message: `${result.addedCount} leads added to campaign`,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    callLead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            let leadId = String(req.body.leadId || req.params.leadId || "");
            if (!leadId) {
                const anyLead = await LeadModel.findOne();
                if (anyLead) {
                    leadId = anyLead._id.toString();
                } else {
                    const newLead = await LeadModel.create({
                        firstName: "Alex",
                        lastName: "Morgan",
                        phone: "+91 98765 43210",
                        status: "NEW",
                    });
                    leadId = newLead._id.toString();
                }
            }

            const customerReply = req.body.customerReply || req.body.userResponse || req.body.leadInput || req.body.message;
            const result = await this.aiCampaignService.callLeadWithAI(campaignId, leadId, {
                customerReply,
                conversationId: req.body.conversationId,
                surveySessionId: req.body.surveySessionId,
                surveyId: req.body.surveyId,
            });
            return res.json({
                success: true,
                message: customerReply ? "AI Voice response generated" : "AI Voice Call initiated with lead",
                data: result,
            });

        } catch (error) {
            next(error);
        }
    };

    callLeadTwilio = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            let leadId = String(req.body.leadId || "");
            let to = req.body.to || req.body.phone;

            if (!to && leadId) {
                const lead = await LeadModel.findById(leadId);
                if (lead?.phone) {
                    to = lead.phone;
                }
            }

            if (!to) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number 'to' or valid leadId with phone number is required",
                });
            }

            const result = await this.twilioService.initiateCall({
                to,
                campaignId,
                leadId,
                conversationId: req.body.conversationId,
                surveySessionId: req.body.surveySessionId,
            });

            return res.json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    attachSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            const surveyId = String(req.body.surveyId || "");

            if (!surveyId) {
                return res.status(400).json({
                    success: false,
                    message: "surveyId is required",
                });
            }

            const updated = await this.campaignService.attachSurvey(campaignId, surveyId);

            return res.json({
                success: true,
                message: "Survey attached to campaign successfully",
                data: updated,
            });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const campaignId = String(req.params.id || "");
            await this.campaignService.deleteCampaign(campaignId);

            return res.json({
                success: true,
                message: "Campaign deleted successfully",
            });
        } catch (err) {
            next(err);
        }
    };
}