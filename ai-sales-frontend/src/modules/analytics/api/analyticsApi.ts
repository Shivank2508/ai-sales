<<<<<<< HEAD
import { axiosInstance } from "../../../services/api/apiClient";
import { mockStore } from "../../../services/api/mockDataStore";
import { ICampaignAnalytics } from "../../../types";

export interface IProductAnalytics {
  totalConversations: number;
  intent?: Record<string, number>;
  sentiment?: Record<string, number>;
  outcomes?: Record<string, number>;
  objections?: Record<string, number>;
  buyingSignals?: string[];
  competitorMentions?: Array<{ competitor: string; count: number }>;
  purchaseRate?: number;
  demoRequestRate?: number;
  followUpRate?: number;
}

export interface IDashboardMetrics {
  leads: {
    total: number;
    byStatus: Record<string, number>;
    conversionRate: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  surveys: {
    total: number;
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  };
  conversations: {
    total: number;
    byChannel: Record<string, number>;
  };
  followUps: {
    total: number;
    pending: number;
    completed: number;
  };
  intelligence: {
    totalAnalyzed: number;
    avgSentimentScore: number;
    avgLeadScore: number;
  };
}

export interface ISurveyAnalytics {
  surveyId: string;
  name: string;
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  completionRate: number;
  avgCompletionTimeSeconds: number;
  questions: Array<{
    questionId: string;
    order: number;
    text: string;
    type: string;
    answeredCount: number;
    skippedCount: number;
    dropoffCount: number;
    dropoffRate: number;
    averageValue?: number;
    distribution: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  }>;
}

export interface IBusinessInsightItem {
  type: "OPPORTUNITY" | "RISK" | "TREND" | "ANOMALY" | "RECOMMENDATION";
  title: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  metricChange?: string;
  recommendedAction: string;
  targetModule?: string;
}

export const analyticsApi = {
  // GET dashboard metrics
  async getDashboardMetrics(): Promise<IDashboardMetrics> {
    try {
      const res = await axiosInstance.get("/api/analytics/dashboard");
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getDashboardMetrics error, using fallback:", err);
    }

    return {
      leads: { total: 0, byStatus: {}, conversionRate: 0 },
      campaigns: { total: 0, active: 0 },
      surveys: { total: 0, totalSessions: 0, completedSessions: 0, completionRate: 0 },
      conversations: { total: 0, byChannel: {} },
      followUps: { total: 0, pending: 0, completed: 0 },
      intelligence: { totalAnalyzed: 0, avgSentimentScore: 0.5, avgLeadScore: 50 },
    };
  },

  // GET campaign analytics
  async getCampaignAnalytics(campaignId: string): Promise<ICampaignAnalytics> {
    try {
      const res = await axiosInstance.get(`/api/analytics/campaigns/${campaignId}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    const all = mockStore.getAnalytics();
    return all[campaignId] || (Object.values(all)[0] as ICampaignAnalytics);
  },

  // GET survey analytics
  async getSurveyAnalytics(surveyId: string): Promise<ISurveyAnalytics | null> {
    try {
      const res = await axiosInstance.get(`/api/analytics/surveys/${surveyId}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getSurveyAnalytics error:", err);
    }
    return null;
  },

  // GET AI agent analytics
  async getAgentAnalytics(): Promise<any> {
    try {
      const res = await axiosInstance.get("/api/analytics/agent");
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getAgentAnalytics error:", err);
    }
    return null;
  },

  // GET lead 360 overview
  async getLead360(leadId: string): Promise<any> {
    const res = await axiosInstance.get(`/api/analytics/leads/${leadId}/360`);
    return res.data?.data;
  },

  // GET AI business insights
  async getInsights(): Promise<any> {
    try {
      const res = await axiosInstance.get("/api/insights");
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getInsights error:", err);
    }
    return { all: [], opportunities: [], risks: [], trends: [], recommendations: [] };
  },

  // GENERATE AI business insights
  async generateInsights(): Promise<any> {
    const res = await axiosInstance.post("/api/insights/generate");
    return res.data?.data;
  },

  // GET conversation intelligence analytics for a product
  async getProductAnalytics(productId: string): Promise<IProductAnalytics | null> {
    try {
      const res = await axiosInstance.get(`/api/conversation-intelligence/analytics/product/${productId}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend getProductAnalytics error:", err);
    }
    return null;
  },

  // TRIGGER conversation analysis
  async analyzeConversation(conversationId: string): Promise<any> {
    const res = await axiosInstance.post("/api/conversation-intelligence/analyze", { conversationId });
    return res.data?.data;
=======
import { mockStore, SEED_ANALYTICS } from "../../../services/api/mockDataStore";
import { ICampaignAnalytics } from "../../../types";

export const analyticsApi = {
  // GET campaign analytics
  async getCampaignAnalytics(campaignId: string): Promise<ICampaignAnalytics> {
    const analyticsMap = mockStore.getAnalytics();
    if (analyticsMap[campaignId]) {
      return analyticsMap[campaignId];
    }

    // Generate fallback baseline analytics
    return {
      campaignId,
      totalResponses: 150,
      completedResponses: 132,
      completionRate: 88,
      averageDurationSeconds: 110,
      intentDistribution: {
        positive: 65,
        maybe: 15,
        negative: 20,
        neutral: 0,
      },
      questionDropOffs: [
        { questionId: "q1", questionText: "Initial Question", reachedCount: 150, dropOffCount: 5, dropOffRate: 3.3 },
        { questionId: "q2", questionText: "Secondary Question", reachedCount: 145, dropOffCount: 8, dropOffRate: 5.5 },
      ],
      responsesOverTime: [
        { date: "Oct 01", responses: 20, completed: 18 },
        { date: "Oct 02", responses: 35, completed: 30 },
        { date: "Oct 03", responses: 45, completed: 40 },
        { date: "Oct 04", responses: 50, completed: 44 },
      ],
      aiInsights: [
        "Survey completion rate is healthy at 88%.",
        "Voice conversation length averages 1m 50s.",
      ],
    };
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
  },
};
