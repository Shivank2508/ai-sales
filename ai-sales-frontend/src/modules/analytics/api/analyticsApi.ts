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
  },
};
