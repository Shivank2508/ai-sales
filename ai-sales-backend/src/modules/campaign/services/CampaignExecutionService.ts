import mongoose from "mongoose";
import { CampaignRepository } from "../repositories/CampaignRepository";
import { CampaignLeadRepository } from "../repositories/CampaignLeadRepository";
import { CampaignStatus } from "../models/Campaign.model";
import { CampaignActionType, CampaignLeadStatus } from "../models/CampaignLead.model";
import { LeadModel } from "../../leads/lead.model";
import { SurveyExecutionService } from "../../survey/services/SurveyExecutionService";
import { ChatRepository } from "../../chat/chat.repository";

export class CampaignExecutionService {
    constructor(
        private readonly campaignRepository = new CampaignRepository(),
        private readonly campaignLeadRepository = new CampaignLeadRepository(),
        private readonly surveyExecutionService = new SurveyExecutionService(),
        private readonly chatRepository = new ChatRepository()
    ) {}

    /**
     * Resolves the list of eligible lead IDs based on campaign audience configuration
     */
    async resolveAudience(campaignId: string): Promise<string[]> {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const audience = campaign.audience || {};
        const explicitLeadIds = audience.leadIds || [];

        if (explicitLeadIds.length > 0) {
            return explicitLeadIds.map((id) => id.toString());
        }

        const filters = audience.filters || {};
        const query: Record<string, any> = {};

        if (filters.status && filters.status.length > 0) {
            query.status = { $in: filters.status };
        }
        if (filters.industry && filters.industry.length > 0) {
            query.industry = { $in: filters.industry };
        }
        if (filters.location && filters.location.length > 0) {
            query.location = { $in: filters.location };
        }
        if (typeof filters.minScore === "number" || typeof filters.maxScore === "number") {
            query.score = {};
            if (typeof filters.minScore === "number") query.score.$gte = filters.minScore;
            if (typeof filters.maxScore === "number") query.score.$lte = filters.maxScore;
        }

        const matchedLeads = await LeadModel.find(query).limit(500).select("_id").lean().exec();

        if (matchedLeads.length > 0) {
            return matchedLeads.map((l) => l._id.toString());
        }

        // Fallback to all existing leads if no explicit filter is applied
        const allLeads = await LeadModel.find().limit(100).select("_id").lean().exec();
        return allLeads.map((l) => l._id.toString());
    }

    /**
     * Launches a campaign and triggers execution across all eligible audience leads
     */
    async launchCampaign(campaignId: string): Promise<{
        campaign: any;
        totalAudience: number;
        executedCount: number;
    }> {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign with ID ${campaignId} not found`);
        }

        const leadIds = await this.resolveAudience(campaignId);
        const action = campaign.action || CampaignActionType.SURVEY;

        // Update campaign status to RUNNING
        await this.campaignRepository.updateStatus(campaignId, CampaignStatus.RUNNING);

        let executedCount = 0;

        for (const leadId of leadIds) {
            try {
                // Idempotent execution check
                let execution = await this.campaignLeadRepository.findByCampaignAndLead(
                    campaignId,
                    leadId
                );

                if (execution && execution.status === CampaignLeadStatus.COMPLETED) {
                    continue; // Skip already completed
                }

                // Create initial record
                execution = await this.campaignLeadRepository.upsertLeadExecution(
                    campaignId,
                    leadId,
                    {
                        action,
                        status: CampaignLeadStatus.IN_PROGRESS,
                    }
                );

                let surveySessionId: string | undefined;
                let conversationId: string | undefined;

                // 1. Create linked conversation
                const conv = await this.chatRepository.createConversation({
                    leadId: new mongoose.Types.ObjectId(leadId),
                    campaignId: new mongoose.Types.ObjectId(campaignId),
                    productId: campaign.productId,
                    channel: action === CampaignActionType.CALL ? "VOICE" : "CHAT",
                    title: `${campaign.name} - Outreach`,
                    status: "ACTIVE",
                });
                conversationId = (conv as any)._id.toString();

                // 2. If campaign is SURVEY-based and has surveyId, start survey session
                if (campaign.surveyId) {
                    try {
                        const surveyResult: any = await this.surveyExecutionService.startSurvey({
                            surveyId: campaign.surveyId.toString(),
                            campaignId,
                            leadId,
                            conversationId,
                            metadata: { campaignName: campaign.name },
                        });
                        surveySessionId = surveyResult.session?._id ? String(surveyResult.session._id) : undefined;

                        // Link survey session back to conversation
                        if (conversationId) {
                            await this.chatRepository.updateConversationLinks(conversationId, {
                                surveyId: campaign.surveyId.toString(),
                                surveySessionId,
                            });
                        }
                    } catch (surveyErr: any) {
                        console.warn(`[CampaignExecution] Survey start warning for lead ${leadId}:`, surveyErr?.message);
                    }
                }

                // Update lead execution record to CONTACTED
                await this.campaignLeadRepository.updateStatus(
                    campaignId,
                    leadId,
                    CampaignLeadStatus.CONTACTED,
                    {
                        conversationId: conversationId ? new mongoose.Types.ObjectId(conversationId) : undefined,
                        surveySessionId: surveySessionId ? new mongoose.Types.ObjectId(surveySessionId) : undefined,
                        lastContactedAt: new Date(),
                    }
                );

                // Update lead status to CONTACTED in leads table
                await LeadModel.findByIdAndUpdate(leadId, {
                    $set: { status: "CONTACTED" },
                }).exec();

                executedCount++;
            } catch (err: any) {
                console.error(`[CampaignExecution] Error executing for lead ${leadId}:`, err);
                await this.campaignLeadRepository.updateStatus(
                    campaignId,
                    leadId,
                    CampaignLeadStatus.FAILED,
                    { error: err?.message || "Execution error" }
                );
            }
        }

        // Recalculate campaign stats
        const stats = await this.campaignLeadRepository.getCampaignLeadStats(campaignId);
        const total = stats.total || leadIds.length;
        const contacted = stats.contacted + stats.completed;
        const completed = stats.completed;

        const updatedStats = {
            totalLeads: total,
            eligibleLeads: total,
            startedLeads: stats.inProgress + contacted,
            contactedLeads: contacted,
            completedLeads: completed,
            failedLeads: stats.failed,
            skippedLeads: stats.skipped,
            conversionRate: contacted > 0 ? Math.round((completed / contacted) * 100) : 0,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            responseRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
        };

        const updatedCampaign = await this.campaignRepository.update(campaignId, {
            stats: updatedStats as any,
        });

        return {
            campaign: updatedCampaign,
            totalAudience: leadIds.length,
            executedCount,
        };
    }

    /**
     * Retrieves all lead executions for a campaign
     */
    async getCampaignLeads(campaignId: string) {
        return this.campaignLeadRepository.findByCampaignId(campaignId);
    }

    /**
     * Pauses an active campaign
     */
    async pauseCampaign(campaignId: string) {
        return this.campaignRepository.updateStatus(campaignId, CampaignStatus.PAUSED);
    }

    /**
     * Resumes a paused campaign
     */
    async resumeCampaign(campaignId: string) {
        return this.campaignRepository.updateStatus(campaignId, CampaignStatus.RUNNING);
    }

    /**
     * Cancels a campaign
     */
    async cancelCampaign(campaignId: string) {
        return this.campaignRepository.updateStatus(campaignId, CampaignStatus.CANCELLED);
    }
}
