import { Request, Response, NextFunction } from "express";
import { TwilioService } from "./twilio.service";
import { LeadModel } from "../leads/lead.model";

export class TwilioController {
    constructor(
        private readonly twilioService = new TwilioService()
    ) {}

    /**
     * GET /api/voice/twilio/status
     */
    getStatus = async (req: Request, res: Response) => {
        const status = this.twilioService.getStatus();
        return res.json({
            success: true,
            data: status,
        });
    };

    /**
     * POST /api/voice/twilio/call
     */
    initiateCall = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let { to, campaignId, leadId, conversationId, surveySessionId } = req.body;

            if (!to && leadId) {
                const lead = await LeadModel.findById(leadId);
                if (lead?.phone) {
                    to = lead.phone;
                }
            }

            if (!to) {
                return res.status(400).json({
                    success: false,
                    message: "Destination phone number ('to') or valid leadId with phone is required",
                });
            }

            const result = await this.twilioService.initiateCall({
                to,
                campaignId: campaignId || "",
                leadId: leadId || "",
                conversationId,
                surveySessionId,
            });

            return res.json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error: any) {
            console.error("[TwilioController] initiateCall error:", error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || "Twilio call failed",
                code: error.code,
                moreInfo: error.moreInfo,
            });
        }
    };

    /**
     * POST|GET /api/voice/twilio/voice-webhook
     */
    voiceWebhook = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || req.body.campaignId || ""),
                leadId: String(req.query.leadId || req.body.leadId || ""),
                conversationId: String(req.query.conversationId || req.body.conversationId || ""),
                surveySessionId: String(req.query.surveySessionId || req.body.surveySessionId || ""),
            };

            const twiml = await this.twilioService.handleVoiceWebhook(queryParams);
            res.type("text/xml");
            return res.send(twiml);
        } catch (error: any) {
            console.error("[TwilioController] voiceWebhook error:", error);
            res.type("text/xml");
            return res.send(
                `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred connecting your call. Please try again later. Goodbye.</Say><Hangup/></Response>`
            );
        }
    };

    /**
     * POST /api/voice/twilio/gather-webhook
     */
    gatherWebhook = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || req.body.campaignId || ""),
                leadId: String(req.query.leadId || req.body.leadId || ""),
                conversationId: String(req.query.conversationId || req.body.conversationId || ""),
                surveySessionId: String(req.query.surveySessionId || req.body.surveySessionId || ""),
            };

            const twiml = await this.twilioService.handleGatherWebhook(req.body, queryParams);
            res.type("text/xml");
            return res.send(twiml);
        } catch (error: any) {
            console.error("[TwilioController] gatherWebhook error:", error);
            res.type("text/xml");
            return res.send(
                `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for your response. Goodbye.</Say><Hangup/></Response>`
            );
        }
    };

    /**
     * POST /api/voice/twilio/status-callback
     */
    statusCallback = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || ""),
                leadId: String(req.query.leadId || ""),
            };

            await this.twilioService.handleStatusCallback(req.body, queryParams);
            return res.sendStatus(200);
        } catch (error: any) {
            console.error("[TwilioController] statusCallback error:", error);
            return res.sendStatus(200); // Always 200 OK to Twilio
        }
    };
}
