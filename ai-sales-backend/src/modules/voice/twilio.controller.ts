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
     * GET /api/voice/twilio/debug
     */
    debug = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || ""),
                leadId: String(req.query.leadId || ""),
                conversationId: String(req.query.conversationId || ""),
                surveySessionId: String(req.query.surveySessionId || ""),
            };
            const twiml = await this.twilioService.handleVoiceWebhook(queryParams);
            return res.json({
                success: true,
                version: "v2.2-bulletproof",
                twiml,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                version: "v2.2-bulletproof",
                error: error.message,
                stack: error.stack,
            });
        }
    };

    /**
     * POST|GET /api/voice/twilio/voice-webhook
     */
    voiceWebhook = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || req.body?.campaignId || ""),
                leadId: String(req.query.leadId || req.body?.leadId || ""),
                conversationId: String(req.query.conversationId || req.body?.conversationId || ""),
                surveySessionId: String(req.query.surveySessionId || req.body?.surveySessionId || ""),
            };

            const twiml = await this.twilioService.handleVoiceWebhook(queryParams);
            res.type("text/xml");
            return res.send(twiml);
        } catch (error: any) {
            console.error("[TwilioController] voiceWebhook error:", error);
            res.type("text/xml");
            return res.send(
                `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">Hello! Thank you for taking our call. Have a wonderful day!</Say><Hangup/></Response>`
            );
        }
    };

    /**
     * POST /api/voice/twilio/gather-webhook
     */
    gatherWebhook = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || req.body?.campaignId || ""),
                leadId: String(req.query.leadId || req.body?.leadId || ""),
                conversationId: String(req.query.conversationId || req.body?.conversationId || ""),
                surveySessionId: String(req.query.surveySessionId || req.body?.surveySessionId || ""),
            };

            const twiml = await this.twilioService.handleGatherWebhook(req.body || {}, queryParams);
            res.type("text/xml");
            return res.send(twiml);
        } catch (error: any) {
            console.error("[TwilioController] gatherWebhook error:", error);
            res.type("text/xml");
            return res.send(
                `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">Thank you so much for sharing your feedback with us. Have a wonderful day! Goodbye.</Say><Hangup/></Response>`
            );
        }
    };

    /**
     * GET /api/voice/twilio/notifications/:callSid
     */
    getCallNotifications = async (req: Request, res: Response) => {
        try {
            const callSid = String(req.params.callSid || req.query.callSid || "");
            const result = await this.twilioService.getCallNotifications(callSid);
            return res.json({ success: true, data: result });
        } catch (e: any) {
            return res.status(500).json({ success: false, error: e.message });
        }
    };

    /**
     * GET /api/voice/twilio/recent-calls
     */
    getRecentCalls = async (req: Request, res: Response) => {
        try {
            const result = await this.twilioService.getRecentCalls();
            return res.json({ success: true, data: result });
        } catch (e: any) {
            return res.status(500).json({ success: false, error: e.message });
        }
    };

    /**
     * GET /api/voice/twilio/alerts
     */
    getAlerts = async (req: Request, res: Response) => {
        try {
            const data = await this.twilioService.getMonitorAlerts();
            return res.json({ success: true, data });
        } catch (e: any) {
            return res.status(500).json({ success: false, error: e.message });
        }
    };

    /**
     * POST /api/voice/twilio/status-callback
     */
    statusCallback = async (req: Request, res: Response) => {
        try {
            const queryParams = {
                campaignId: String(req.query.campaignId || req.body?.campaignId || ""),
                leadId: String(req.query.leadId || req.body?.leadId || ""),
            };

            await this.twilioService.handleStatusCallback(req.body || {}, queryParams);
            return res.sendStatus(200);
        } catch (error: any) {
            console.error("[TwilioController] statusCallback error:", error);
            return res.sendStatus(200); // Always 200 OK to Twilio
        }
    };
}
