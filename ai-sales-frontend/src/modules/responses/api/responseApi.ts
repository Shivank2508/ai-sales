import { mockStore } from "../../../services/api/mockDataStore";
import { ISurveyResponse, ResponseStatus } from "../../../types";

export const responseApi = {
  // GET responses by campaign ID
  async getResponsesByCampaign(
    campaignId: string,
    filters?: { status?: string; search?: string }
  ): Promise<ISurveyResponse[]> {
    let list = mockStore.getResponses().filter((r) => r.campaignId === campaignId);

    if (filters?.status && filters.status !== "all") {
      list = list.filter((r) => r.status === filters.status);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.responseId.toLowerCase().includes(s) ||
          r.leadName?.toLowerCase().includes(s) ||
          r.leadPhone?.includes(s)
      );
    }

    return list;
  },

  // GET single response
  async getResponseById(responseId: string): Promise<ISurveyResponse> {
    const list = mockStore.getResponses();
    const found = list.find((r) => r._id === responseId || r.responseId === responseId);
    if (!found) {
      throw new Error(`Response with ID ${responseId} not found.`);
    }
    return found;
  },

  // CREATE / SUBMIT response
  async recordAnswer(
    responseId: string,
    answer: {
      questionId: string;
      questionText?: string;
      rawAnswer: string;
      normalizedAnswer: any;
      confidence?: number;
      intent?: string;
    }
  ): Promise<ISurveyResponse> {
    const list = mockStore.getResponses();
    const idx = list.findIndex((r) => r._id === responseId || r.responseId === responseId);
    if (idx !== -1) {
      const resp = list[idx];
      resp.answers.push({
        ...answer,
        extractedBy: "ai",
        answeredAt: new Date().toISOString(),
      });
      mockStore.saveResponses(list);
      return resp;
    }
    throw new Error(`Response ${responseId} not found.`);
  },
};
