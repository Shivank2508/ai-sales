import twilio from "twilio";
import mongoose from "mongoose";
import { AICampaignService } from "../campaign/services/AICampaignService";
import { CampaignLeadRepository } from "../campaign/repositories/CampaignLeadRepository";
import { CampaignLeadStatus } from "../campaign/models/CampaignLead.model";
import { LeadModel } from "../leads/lead.model";
import { CampaignModel } from "../campaign/models/Campaign.model";

export interface InitiateCallParams {
    to: string;
    campaignId: string;
    leadId: string;
    conversationId?: string;
    surveySessionId?: string;
}

export class TwilioService {
    private client?: twilio.Twilio;
    private accountSid: string;
    private authToken: string;
    private phoneNumber: string;
    private publicUrl: string;

    constructor(
        private readonly aiCampaignService = new AICampaignService(),
        private readonly campaignLeadRepo = new CampaignLeadRepository()
    ) {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
        this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
        this.publicUrl = (process.env.PUBLIC_URL || process.env.APP_URL || "https://ai-sales-yjn1.onrender.com").replace(/\/$/, "");

        if (this.accountSid && this.authToken) {
            try {
                this.client = twilio(this.accountSid, this.authToken);
            } catch (err: any) {
                console.warn("[TwilioService] Failed to initialize Twilio client:", err.message);
            }
        }
    }

    /**
     * Checks if Twilio is fully configured with credentials
     */
    isConfigured(): boolean {
        return Boolean(this.client && this.accountSid && this.authToken && this.phoneNumber);
    }

    /**
     * Returns configuration status for diagnostics
     */
    getStatus() {
        return {
            version: "v2.2-bulletproof",
            configured: this.isConfigured(),
            hasAccountSid: Boolean(this.accountSid),
            hasAuthToken: Boolean(this.authToken),
            hasPhoneNumber: Boolean(this.phoneNumber),
            phoneNumber: this.phoneNumber ? this.maskPhone(this.phoneNumber) : null,
            publicUrl: this.publicUrl,
            webhookUrls: {
                voiceWebhook: `${this.publicUrl}/api/voice/twilio/voice-webhook`,
                gatherWebhook: `${this.publicUrl}/api/voice/twilio/gather-webhook`,
                statusCallback: `${this.publicUrl}/api/voice/twilio/status-callback`,
            },
        };
    }

    /**
     * Inspects Twilio debugger alerts / error notifications for a call
     */
    async getCallNotifications(callSid: string) {
        if (!this.client) return { error: "Twilio client not initialized" };
        try {
            const call = await this.client.calls(callSid).fetch();
            const notifications = await this.client.calls(callSid).notifications.list({ limit: 10 });
            return {
                sid: call.sid,
                status: call.status,
                duration: call.duration,
                to: call.to,
                from: call.from,
                notifications: notifications.map((n) => ({
                    errorCode: n.errorCode,
                    messageText: n.messageText,
                    requestUrl: n.requestUrl,
                    responseBody: n.responseBody,
                    responseCode: (n as any).responseCode,
                    messageDate: n.messageDate,
                })),
            };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    async getRecentCalls() {
        if (!this.client) return [];
        try {
            const calls = await this.client.calls.list({ limit: 5 });
            return Promise.all(
                calls.map(async (c) => {
                    const notifs = await this.client!.calls(c.sid).notifications.list();
                    return {
                        sid: c.sid,
                        status: c.status,
                        duration: c.duration,
                        dateCreated: c.dateCreated,
                        notifications: notifs.map((n) => ({
                            errorCode: n.errorCode,
                            messageText: n.messageText,
                            requestUrl: n.requestUrl,
                        })),
                    };
                })
            );
        } catch (e: any) {
            return { error: e.message };
        }
    }

    /**
     * Normalizes phone number format
     */
    private normalizePhoneNumber(phone: string): string {
        let clean = phone.replace(/[\s\-\(\)]/g, "");
        if (!clean.startsWith("+")) {
            if (clean.length === 10) {
                clean = `+91${clean}`; // Default Indian phone numbers if 10 digits
            } else {
                clean = `+${clean}`;
            }
        }
        return clean;
    }

    private maskPhone(phone: string): string {
        if (phone.length < 5) return "***";
        return phone.slice(0, 3) + "****" + phone.slice(-3);
    }

    private createVoiceResponse(): any {
        try {
            const VoiceResponse = require("twilio/lib/twiml/VoiceResponse");
            if (typeof VoiceResponse === "function") {
                return new VoiceResponse();
            }
        } catch {}
        try {
            const tw = require("twilio");
            const VR = tw?.twiml?.VoiceResponse || tw?.default?.twiml?.VoiceResponse;
            if (typeof VR === "function") {
                return new VR();
            }
        } catch {}

        // 100% resilient fallback XML generator conforming to Twilio TwiML
        const parts: string[] = [];
        const escapeXml = (str: string) =>
            (str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");

        return {
            gather: (opts: any) => {
                const actionStr = opts.action ? ` action="${escapeXml(opts.action)}"` : "";
                const methodStr = opts.method ? ` method="${opts.method}"` : ' method="POST"';
                const timeoutStr = opts.speechTimeout ? ` speechTimeout="${opts.speechTimeout}"` : "";
                const langStr = opts.language ? ` language="${opts.language}"` : ' language="en-US"';
                const gatherBody: string[] = [];

                return {
                    say: (sayOpts: any, text?: string) => {
                        const content = typeof sayOpts === "string" ? sayOpts : text || "";
                        const voice = typeof sayOpts === "object" && sayOpts?.voice ? ` voice="${sayOpts.voice}"` : ' voice="Polly.Joanna"';
                        const lang = typeof sayOpts === "object" && sayOpts?.language ? ` language="${sayOpts.language}"` : ' language="en-US"';
                        gatherBody.push(`<Say${voice}${lang}>${escapeXml(content)}</Say>`);
                        parts.push(`<Gather input="speech"${actionStr}${methodStr}${timeoutStr}${langStr}>${gatherBody.join("")}</Gather>`);
                    },
                };
            },
            say: (opts: any, text?: string) => {
                const content = typeof opts === "string" ? opts : text || "";
                const voice = typeof opts === "object" && opts?.voice ? ` voice="${opts.voice}"` : ' voice="Polly.Joanna"';
                const lang = typeof opts === "object" && opts?.language ? ` language="${opts.language}"` : ' language="en-US"';
                parts.push(`<Say${voice}${lang}>${escapeXml(content)}</Say>`);
            },
            hangup: () => {
                parts.push("<Hangup/>");
            },
            toString: () => `<?xml version="1.0" encoding="UTF-8"?><Response>${parts.join("")}</Response>`,
        };
    }

    /**
     * Initiates an outbound voice call to a lead
     */
    async initiateCall(params: InitiateCallParams): Promise<{
        success: boolean;
        callSid?: string;
        simulated?: boolean;
        message: string;
        to: string;
    }> {
        const { to, campaignId, leadId, conversationId, surveySessionId } = params;
        const normalizedTo = this.normalizePhoneNumber(to);

        // Build callback URLs
        const queryParams = new URLSearchParams({
            campaignId,
            leadId,
            ...(conversationId ? { conversationId } : {}),
            ...(surveySessionId ? { surveySessionId } : {}),
        }).toString();

        const voiceUrl = `${this.publicUrl}/api/voice/twilio/voice-webhook?${queryParams}`;
        const statusCallbackUrl = `${this.publicUrl}/api/voice/twilio/status-callback?campaignId=${campaignId}&leadId=${leadId}`;

        if (!this.isConfigured() || !this.client) {
            console.log(
                `[TwilioService] Live Twilio calling not configured. Simulated call to ${normalizedTo} using voiceUrl: ${voiceUrl}`
            );
            return {
                success: true,
                simulated: true,
                to: normalizedTo,
                message: `Twilio credentials not configured in environment. Test call simulated for ${normalizedTo}. To make real phone calls, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER on Render.`,
            };
        }

        try {
            const call = await this.client.calls.create({
                to: normalizedTo,
                from: this.phoneNumber,
                url: voiceUrl,
            });

            console.log(`[TwilioService] Call created: ${call.sid} to ${normalizedTo}`);

            // Update lead status to IN_PROGRESS / CONTACTED
            if (
                campaignId &&
                leadId &&
                mongoose.Types.ObjectId.isValid(campaignId) &&
                mongoose.Types.ObjectId.isValid(leadId)
            ) {
                try {
                    await this.campaignLeadRepo.upsertLeadExecution(campaignId, leadId, {
                        status: CampaignLeadStatus.IN_PROGRESS,
                        lastContactedAt: new Date(),
                        metadata: { twilioCallSid: call.sid, to: normalizedTo },
                    });
                } catch (dbErr: any) {
                    console.warn("[TwilioService] Could not record lead execution in DB:", dbErr.message);
                }
            }

            return {
                success: true,
                callSid: call.sid,
                simulated: false,
                to: normalizedTo,
                message: `Outbound AI phone call initiated to ${normalizedTo}`,
            };
        } catch (error: any) {
            console.error(`[TwilioService] Error creating call to ${normalizedTo}:`, error);
            throw new Error(`Twilio call failed: ${error.message || "Unknown error"}`);
        }
    }

    /**
     * Handles incoming voice webhook from Twilio when lead answers
     */
    async handleVoiceWebhook(queryParams: {
        campaignId?: string;
        leadId?: string;
        conversationId?: string;
        surveySessionId?: string;
    }): Promise<string> {
        const { campaignId, leadId, conversationId, surveySessionId } = queryParams;
        const response = this.createVoiceResponse();

        let initialSpeech = "Hello! I am calling from the AI sales outreach team. Thank you for answering our call!";
        let convId = conversationId;
        let sessId = surveySessionId;

        if (campaignId && leadId) {
            try {
                const aiResult = await this.aiCampaignService.callLeadWithAI(campaignId, leadId, {
                    conversationId: convId,
                    surveySessionId: sessId,
                    skipTTS: true,
                });

                if (aiResult?.openingSpeech) {
                    initialSpeech = aiResult.openingSpeech;
                } else if (aiResult?.aiSpeech) {
                    initialSpeech = aiResult.aiSpeech;
                } else if (aiResult?.text) {
                    initialSpeech = aiResult.text;
                } else if (aiResult?.script) {
                    initialSpeech = aiResult.script;
                } else if (aiResult?.currentQuestion?.text) {
                    initialSpeech = aiResult.currentQuestion.text;
                }

                convId = aiResult?.conversationId || convId;
                sessId = aiResult?.surveySessionId || sessId;
            } catch (err: any) {
                console.warn("[TwilioService] Error fetching AI opening script:", err.message);
            }
        }

        const nextQuery = new URLSearchParams({
            ...(campaignId ? { campaignId } : {}),
            ...(leadId ? { leadId } : {}),
            ...(convId ? { conversationId: convId } : {}),
            ...(sessId ? { surveySessionId: sessId } : {}),
        }).toString();

        const gatherUrl = `${this.publicUrl}/api/voice/twilio/gather-webhook?${nextQuery}`;

        // Create interactive speech gather
        const gather = response.gather({
            input: ["speech"],
            action: gatherUrl,
            method: "POST",
            speechTimeout: "auto",
            language: "en-US",
        });

        gather.say(
            {
                voice: "Polly.Joanna",
                language: "en-US",
            },
            initialSpeech
        );

        // Fallback if no speech was detected
        response.say(
            {
                voice: "Polly.Joanna",
                language: "en-US",
            },
            "We did not hear any response. Thank you, and have a wonderful day! Goodbye."
        );
        response.hangup();

        return response.toString();
    }

    /**
     * Handles speech input from lead captured by Twilio Gather
     */
    async handleGatherWebhook(body: any, queryParams: {
        campaignId?: string;
        leadId?: string;
        conversationId?: string;
        surveySessionId?: string;
    }): Promise<string> {
        const { campaignId, leadId, conversationId, surveySessionId } = queryParams;
        const speechResult = body.SpeechResult || body.speechResult || "";
        const response = this.createVoiceResponse();

        console.log(`[TwilioService] Lead voice input: "${speechResult}"`);

        if (!speechResult || speechResult.trim().length === 0) {
            // Prompt again once
            const repeatQuery = new URLSearchParams({
                ...(campaignId ? { campaignId } : {}),
                ...(leadId ? { leadId } : {}),
                ...(conversationId ? { conversationId } : {}),
                ...(surveySessionId ? { surveySessionId } : {}),
            }).toString();

            const gather = response.gather({
                input: ["speech"],
                action: `${this.publicUrl}/api/voice/twilio/gather-webhook?${repeatQuery}`,
                method: "POST",
                speechTimeout: "auto",
                language: "en-US",
            });
            gather.say({ voice: "Polly.Joanna", language: "en-US" }, "I didn't quite catch that. Could you please repeat?");
            response.hangup();
            return response.toString();
        }

        // Process customer reply with AI Campaign & Survey Flow
        let aiSpeech = "Thank you for sharing your feedback.";
        let isCompleted = false;
        let convId = conversationId;
        let sessId = surveySessionId;

        if (campaignId && leadId) {
            try {
                const aiResult = await this.aiCampaignService.callLeadWithAI(campaignId, leadId, {
                    customerReply: speechResult.trim(),
                    conversationId: convId,
                    surveySessionId: sessId,
                    skipTTS: true,
                });

                aiSpeech = aiResult?.aiSpeech || aiResult?.text || aiResult?.message || aiSpeech;
                isCompleted = Boolean(aiResult?.completed || aiResult?.isCompleted);
                convId = aiResult?.conversationId || convId;
                sessId = aiResult?.surveySessionId || sessId;
            } catch (err: any) {
                console.error("[TwilioService] Error processing voice turn with AI:", err);
                aiSpeech = "Thank you for your answer. We have recorded your response.";
            }
        }

        if (isCompleted) {
            // Survey or conversation completed
            response.say(
                {
                    voice: "Polly.Joanna",
                    language: "en-US",
                },
                aiSpeech
            );
            response.hangup();

            if (campaignId && leadId) {
                await this.campaignLeadRepo.updateStatus(campaignId, leadId, CampaignLeadStatus.COMPLETED, {
                    lastContactedAt: new Date(),
                });
            }
        } else {
            // More questions / interactive conversation
            const nextQuery = new URLSearchParams({
                ...(campaignId ? { campaignId } : {}),
                ...(leadId ? { leadId } : {}),
                ...(convId ? { conversationId: convId } : {}),
                ...(sessId ? { surveySessionId: sessId } : {}),
            }).toString();

            const gather = response.gather({
                input: ["speech"],
                action: `${this.publicUrl}/api/voice/twilio/gather-webhook?${nextQuery}`,
                method: "POST",
                speechTimeout: "auto",
                language: "en-US",
            });

            gather.say(
                {
                    voice: "Polly.Joanna",
                    language: "en-US",
                },
                aiSpeech
            );

            // Fallback
            response.say(
                {
                    voice: "Polly.Joanna",
                    language: "en-US",
                },
                "Thank you so much for your valuable time today. Have a great day! Goodbye."
            );
            response.hangup();
        }

        return response.toString();
    }

    /**
     * Handles call status callbacks from Twilio
     */
    async handleStatusCallback(body: any, queryParams: { campaignId?: string; leadId?: string }): Promise<void> {
        const { campaignId, leadId } = queryParams;
        const callStatus = body.CallStatus || "";
        const duration = parseInt(body.CallDuration || "0", 10);
        const callSid = body.CallSid || "";

        console.log(`[TwilioService] Call status callback for ${callSid}: ${callStatus} (duration: ${duration}s)`);

        if (campaignId && leadId) {
            let status = CampaignLeadStatus.CONTACTED;
            if (callStatus === "completed") {
                status = CampaignLeadStatus.COMPLETED;
            } else if (callStatus === "busy" || callStatus === "no-answer" || callStatus === "failed") {
                status = CampaignLeadStatus.FAILED;
            }

            await this.campaignLeadRepo.updateStatus(campaignId, leadId, status, {
                metadata: {
                    twilioCallSid: callSid,
                    callStatus,
                    durationSeconds: duration,
                },
            });
        }
    }
}
