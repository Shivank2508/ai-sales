import mongoose from "mongoose";
import { LeadModel } from "../../leads/lead.model";
import { CampaignModel } from "../../campaign/models/Campaign.model";
import { CampaignLeadModel, CampaignLeadStatus } from "../../campaign/models/CampaignLead.model";
import { SurveyModel } from "../../survey/models/Survey.model";
import { SurveyQuestionModel } from "../../survey/models/SurveyQuestion.model";
import { SurveyResponseModel, SurveyResponseStatus } from "../../survey/models/SurveyResponse.model";
import { ConversationModel } from "../../chat/chat.model";
import { FollowUpModel } from "../../follow-up/follow-up.model";
import { ConversationIntelligenceModel } from "../../conversation-intelligence/conversation-intelligence.model";

export class AnalyticsService {
    /**
     * Dashboard Overview Metrics
     */
    async getDashboardOverview() {
        const [
            totalLeads,
            leadsByStatus,
            totalCampaigns,
            activeCampaigns,
            totalSurveys,
            surveySessions,
            totalConversations,
            conversationsByChannel,
            totalFollowUps,
            pendingFollowUps,
            intelligenceStats,
        ] = await Promise.all([
            LeadModel.countDocuments(),
            LeadModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            CampaignModel.countDocuments(),
            CampaignModel.countDocuments({ status: { $in: ["ACTIVE", "RUNNING", "active", "running"] } } as any),
            SurveyModel.countDocuments(),
            SurveyResponseModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            ConversationModel.countDocuments(),
            ConversationModel.aggregate([
                { $group: { _id: "$channel", count: { $sum: 1 } } },
            ]),
            FollowUpModel.countDocuments(),
            FollowUpModel.countDocuments({ status: "PENDING" } as any),
            ConversationIntelligenceModel.aggregate([
                {
                    $group: {
                        _id: null,
                        avgSentimentScore: { $avg: "$sentimentScore" },
                        avgLeadScore: { $avg: "$leadScore" },
                        totalAnalyzed: { $sum: 1 },
                    },
                },
            ]),
        ]);

        let totalSessionsCount = 0;
        let completedSessionsCount = 0;
        for (const s of (surveySessions as any[])) {
            totalSessionsCount += s.count;
            if (s._id === SurveyResponseStatus.COMPLETED) {
                completedSessionsCount = s.count;
            }
        }

        const completionRate = totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;
        const convertedLeads = (leadsByStatus as any[]).find((s) => s._id === "CONVERTED")?.count || 0;
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

        return {
            leads: {
                total: totalLeads,
                byStatus: (leadsByStatus as any[]).reduce((acc: any, curr: any) => ({ ...acc, [curr._id || "NEW"]: curr.count }), {}),
                conversionRate,
            },
            campaigns: {
                total: totalCampaigns,
                active: activeCampaigns,
            },
            surveys: {
                total: totalSurveys,
                totalSessions: totalSessionsCount,
                completedSessions: completedSessionsCount,
                completionRate,
            },
            conversations: {
                total: totalConversations,
                byChannel: (conversationsByChannel as any[]).reduce((acc: any, curr: any) => ({ ...acc, [curr._id || "CHAT"]: curr.count }), {}),
            },
            followUps: {
                total: totalFollowUps,
                pending: pendingFollowUps,
                completed: totalFollowUps - pendingFollowUps,
            },
            intelligence: {
                totalAnalyzed: (intelligenceStats as any[])[0]?.totalAnalyzed || 0,
                avgSentimentScore: Math.round(((intelligenceStats as any[])[0]?.avgSentimentScore || 0.5) * 100) / 100,
                avgLeadScore: Math.round((intelligenceStats as any[])[0]?.avgLeadScore || 50),
            },
        };
    }

    /**
     * Campaign Analytics
     */
    async getCampaignAnalytics(campaignId?: string): Promise<any> {
        if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
            const campaign: any = await CampaignModel.findById(campaignId).lean().exec();
            if (!campaign) throw new Error("Campaign not found");

            const leadExecutions: any[] = await CampaignLeadModel.find({ campaignId: new mongoose.Types.ObjectId(campaignId) })
                .populate("leadId")
                .lean()
                .exec();

            const statusCounts: Record<string, number> = {
                PENDING: 0,
                IN_PROGRESS: 0,
                CONTACTED: 0,
                COMPLETED: 0,
                FAILED: 0,
                SKIPPED: 0,
            };

            for (const exec of leadExecutions) {
                const st = exec.status || "PENDING";
                statusCounts[st] = (statusCounts[st] || 0) + 1;
            }

            const total = leadExecutions.length;
            const contacted = (statusCounts.CONTACTED || 0) + (statusCounts.COMPLETED || 0);
            const completed = statusCounts.COMPLETED || 0;
            const inProgress = statusCounts.IN_PROGRESS || 0;
            const failed = statusCounts.FAILED || 0;
            const skipped = statusCounts.SKIPPED || 0;

            return {
                campaignId,
                name: campaign.name,
                status: campaign.status,
                action: campaign.action,
                totalLeads: total,
                eligibleLeads: total,
                started: inProgress + contacted,
                contacted,
                completed,
                failed,
                skipped,
                conversionRate: contacted > 0 ? Math.round((completed / contacted) * 100) : 0,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                responseRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
                statusBreakdown: statusCounts,
                leads: leadExecutions,
            };
        }

        // Aggregate across all campaigns
        const allCampaigns: any[] = await CampaignModel.find().lean().exec();
        const results = await Promise.all(
            allCampaigns.map((c) => this.getCampaignAnalytics(c._id.toString()))
        );

        return {
            totalCampaigns: allCampaigns.length,
            campaigns: results,
        };
    }

    /**
     * Survey Analytics with Question Drop-off & Answer Distribution
     */
    async getSurveyAnalytics(surveyId: string) {
        if (!mongoose.Types.ObjectId.isValid(surveyId)) {
            throw new Error("Invalid surveyId");
        }

        const survey = await SurveyModel.findById(surveyId).lean().exec();
        if (!survey) throw new Error("Survey not found");

        const questions = await SurveyQuestionModel.find({ surveyId: new mongoose.Types.ObjectId(surveyId) })
            .sort({ order: 1 })
            .lean()
            .exec();

        const responses = await SurveyResponseModel.find({ surveyId: new mongoose.Types.ObjectId(surveyId) })
            .lean()
            .exec();

        const totalSessions = responses.length;
        let completedSessions = 0;
        let abandonedSessions = 0;
        let totalDurationSeconds = 0;
        let durationCount = 0;

        for (const resp of responses) {
            if (resp.status === SurveyResponseStatus.COMPLETED) {
                completedSessions++;
                if (resp.startedAt && resp.completedAt) {
                    const diffSec = (new Date(resp.completedAt).getTime() - new Date(resp.startedAt).getTime()) / 1000;
                    if (diffSec > 0 && diffSec < 3600) {
                        totalDurationSeconds += diffSec;
                        durationCount++;
                    }
                }
            } else if (resp.status === SurveyResponseStatus.ABANDONED) {
                abandonedSessions++;
            }
        }

        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        const avgCompletionTimeSeconds = durationCount > 0 ? Math.round(totalDurationSeconds / durationCount) : 0;

        // Question analytics & distribution
        const questionAnalytics = questions.map((q) => {
            let answeredCount = 0;
            let skippedCount = 0;
            const answerMap: Record<string, number> = {};
            let numericSum = 0;
            let numericCount = 0;

            for (const resp of responses) {
                const answer = resp.answers?.find((a: any) => a.questionId === q.questionId);
                if (answer) {
                    if (answer.skipped) {
                        skippedCount++;
                    } else {
                        answeredCount++;
                        const normKey = typeof answer.normalizedAnswer === "object"
                            ? JSON.stringify(answer.normalizedAnswer)
                            : String(answer.normalizedAnswer !== undefined ? answer.normalizedAnswer : answer.rawAnswer || "");

                        answerMap[normKey] = (answerMap[normKey] || 0) + 1;

                        if (typeof answer.normalizedAnswer === "number") {
                            numericSum += answer.normalizedAnswer;
                            numericCount++;
                        }
                    }
                }
            }

            const dropoffCount = Math.max(0, totalSessions - (answeredCount + skippedCount));
            const dropoffRate = totalSessions > 0 ? Math.round((dropoffCount / totalSessions) * 100) : 0;

            const distribution = Object.entries(answerMap).map(([val, count]) => ({
                value: val,
                count,
                percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
            }));

            return {
                questionId: q.questionId,
                order: q.order,
                text: q.text,
                type: q.type,
                answeredCount,
                skippedCount,
                dropoffCount,
                dropoffRate,
                averageValue: numericCount > 0 ? Math.round((numericSum / numericCount) * 10) / 10 : undefined,
                distribution,
            };
        });

        return {
            surveyId,
            name: survey.name,
            totalSessions,
            completedSessions,
            abandonedSessions,
            completionRate,
            avgCompletionTimeSeconds,
            questions: questionAnalytics,
        };
    }

    /**
     * AI Agent Analytics
     */
    async getAgentAnalytics() {
        const [totalConversations, voiceConversations, intelligenceDocs, surveySessionsWithAgent] = await Promise.all([
            ConversationModel.countDocuments(),
            ConversationModel.countDocuments({ channel: "VOICE" }),
            ConversationIntelligenceModel.find().lean().exec(),
            SurveyResponseModel.find({ "answers.extractedBy": "ai" }).lean().exec(),
        ]);

        let successfulCount = 0;
        let demoRequested = 0;
        let purchaseInterest = 0;
        let followUpsCreated = 0;

        for (const doc of intelligenceDocs) {
            if (doc.outcome === "DEMO_REQUESTED" || doc.outcome === "PURCHASE" || doc.outcome === "INTERESTED") {
                successfulCount++;
            }
            if (doc.outcome === "DEMO_REQUESTED") demoRequested++;
            if (doc.intent === "PURCHASE_INTENT" || doc.intent === "PRODUCT_INTEREST") purchaseInterest++;
            if (doc.actionItems && doc.actionItems.length > 0) followUpsCreated += doc.actionItems.length;
        }

        const totalAnalyzed = intelligenceDocs.length || 1;
        const conversionRate = totalConversations > 0 ? Math.round((successfulCount / totalConversations) * 100) : 0;

        return {
            totalConversations,
            voiceConversations,
            textConversations: totalConversations - voiceConversations,
            successfulConversations: successfulCount,
            demoRequested,
            purchaseInterest,
            followUpsCreated,
            surveySessionsHandledByAI: surveySessionsWithAgent.length,
            conversionRate,
            averageLeadScore: Math.round(
                intelligenceDocs.reduce((acc, d) => acc + (d.leadScore || 50), 0) / totalAnalyzed
            ),
        };
    }

    /**
     * Complete Lead 360 View
     */
    async getLead360(leadId: string) {
        if (!mongoose.Types.ObjectId.isValid(leadId)) {
            throw new Error("Invalid leadId");
        }

        const leadIdObj = new mongoose.Types.ObjectId(leadId);

        const [lead, campaigns, surveys, conversations, followUps] = await Promise.all([
            LeadModel.findById(leadId).lean().exec(),
            CampaignLeadModel.find({ leadId: leadIdObj }).populate("campaignId").lean().exec(),
            SurveyResponseModel.find({ leadId: leadIdObj }).populate("surveyId").lean().exec(),
            ConversationModel.find({ leadId: leadIdObj }).lean().exec(),
            FollowUpModel.find({ conversationId: { $in: await ConversationModel.find({ leadId: leadIdObj }).distinct("_id") } }).lean().exec(),
        ]);

        if (!lead) throw new Error("Lead not found");

        const convIds = conversations.map((c) => c._id);
        const intelligenceReports = await ConversationIntelligenceModel.find({
            conversationId: { $in: convIds },
        }).lean().exec();

        return {
            lead,
            campaigns: campaigns.map((c: any) => ({
                campaignId: c.campaignId?._id,
                name: c.campaignId?.name,
                status: c.status,
                action: c.action,
                lastContactedAt: c.lastContactedAt,
            })),
            surveys: surveys.map((s: any) => ({
                surveyId: s.surveyId?._id,
                name: s.surveyId?.name,
                status: s.status,
                completionPercentage: s.completionPercentage,
                answers: s.answers,
                completedAt: s.completedAt,
            })),
            conversations: conversations.map((c: any) => ({
                conversationId: c._id,
                title: c.title,
                channel: c.channel,
                status: c.status,
                messagesCount: c.messages?.length || 0,
                updatedAt: c.updatedAt,
            })),
            followUps,
            intelligence: intelligenceReports,
        };
    }
}
