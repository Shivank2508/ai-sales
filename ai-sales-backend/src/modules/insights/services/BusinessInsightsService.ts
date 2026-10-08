import { AnalyticsService } from "../../analytics/services/AnalyticsService";
import { ConversationIntelligenceModel } from "../../conversation-intelligence/conversation-intelligence.model";
import { BusinessInsightModel, IBusinessInsight } from "../models/Insight.model";
import { LLMService } from "../../../services/llm.service";

export class BusinessInsightsService {
    constructor(
        private readonly analyticsService = new AnalyticsService()
    ) {}

    /**
     * Generates grounded AI Business Insights from real platform data
     */
    async generateInsights(): Promise<IBusinessInsight[]> {
        // Gather real database metrics
        const [dashboard, campaigns, intelligenceDocs] = await Promise.all([
            this.analyticsService.getDashboardOverview(),
            this.analyticsService.getCampaignAnalytics(),
            ConversationIntelligenceModel.find().limit(20).lean().exec(),
        ]);

        const objectionsSummary: Record<string, number> = {};
        const buyingSignalsList: string[] = [];
        const competitorMentionsList: string[] = [];

        for (const doc of intelligenceDocs) {
            for (const obj of doc.objections || []) {
                const key = obj.type || "OTHER";
                objectionsSummary[key] = (objectionsSummary[key] || 0) + 1;
            }
            if (doc.buyingSignals) buyingSignalsList.push(...doc.buyingSignals);
            if (doc.competitorMentions) competitorMentionsList.push(...doc.competitorMentions);
        }

        const systemPrompt = `You are a Chief Revenue Officer and Enterprise AI Sales Strategist.
Analyze the provided real metrics and conversation intelligence data from the AI Sales platform.
Identify grounded, high-impact business insights categorized into:
- OPPORTUNITY: High product interest, positive buying signals, emerging market needs.
- RISK: High objections (e.g. price, security, CRM), drop-offs, churn risks.
- TREND: Shifting customer sentiment, common feature requests, response rate patterns.
- RECOMMENDATION: Specific high-leverage actions the sales team and executives should execute.

CRITICAL RULES:
- Ground every insight strictly in the provided data.
- Never invent metrics, percentages, or products not present in the data.
- Provide actionable, executive-level recommendations.`;

        const userPrompt = `Real Platform Metrics:
- Leads Overview: ${JSON.stringify(dashboard.leads)}
- Campaigns Overview: ${JSON.stringify(campaigns)}
- Surveys Overview: ${JSON.stringify(dashboard.surveys)}
- Conversations: ${JSON.stringify(dashboard.conversations)}
- Conversation Intelligence Overview: ${JSON.stringify(dashboard.intelligence)}
- Top Objections Count: ${JSON.stringify(objectionsSummary)}
- Sample Buying Signals: ${JSON.stringify(buyingSignalsList.slice(0, 10))}
- Competitors Mentioned: ${JSON.stringify(competitorMentionsList.slice(0, 10))}`;

        const schema = `{
  "insights": [
    {
      "type": "OPPORTUNITY" | "RISK" | "TREND" | "RECOMMENDATION",
      "title": "string",
      "description": "string",
      "impact": "HIGH" | "MEDIUM" | "LOW",
      "metricChange": "string or null",
      "recommendedAction": "string",
      "targetModule": "CAMPAIGN" | "SURVEY" | "AGENT" | "LEADS" | "PRODUCT"
    }
  ]
}`;

        try {
            const parsed = await LLMService.generateJSON<{ insights: IBusinessInsight[] }>(
                systemPrompt,
                userPrompt,
                schema
            );

            const insights = Array.isArray(parsed?.insights) ? parsed.insights : [];

            // Clear old insights and save freshly generated ones
            if (insights.length > 0) {
                await BusinessInsightModel.deleteMany({});
                await BusinessInsightModel.insertMany(insights);
            }

            return insights;
        } catch (error) {
            console.warn("[BusinessInsightsService] LLM insight generation failed, returning cached/fallback insights:", error);
            const cached = await BusinessInsightModel.find().lean().exec();
            if (cached.length > 0) {
                return cached as any;
            }

            // Fallback rule-based insight
            const defaultInsight: IBusinessInsight = {
                type: "OPPORTUNITY",
                title: "Active Lead Pipeline Engagement",
                description: `You have ${dashboard.leads.total} total leads with an active campaign response rate of ${dashboard.surveys.completionRate}%.`,
                impact: "HIGH",
                recommendedAction: "Launch follow-up campaigns targeting contacted leads with high interest scores.",
                targetModule: "CAMPAIGN",
            };
            return [defaultInsight];
        }
    }

    /**
     * Gets all stored insights grouped by category
     */
    async getInsights() {
        const insights = await BusinessInsightModel.find().sort({ createdAt: -1 }).lean().exec();

        if (insights.length === 0) {
            return this.generateInsights();
        }

        const opportunities = insights.filter((i) => i.type === "OPPORTUNITY");
        const risks = insights.filter((i) => i.type === "RISK");
        const trends = insights.filter((i) => i.type === "TREND");
        const recommendations = insights.filter((i) => i.type === "RECOMMENDATION");

        return {
            total: insights.length,
            all: insights,
            opportunities,
            risks,
            trends,
            recommendations,
        };
    }
}
