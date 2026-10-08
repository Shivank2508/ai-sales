import { axiosInstance } from "../../../services/api/apiClient";
import { mockStore } from "../../../services/api/mockDataStore";
import { CampaignStatus, ICampaign } from "../../../types";

export const campaignApi = {
  // GET all campaigns
  async getCampaigns(filters?: { status?: string; type?: string; search?: string }): Promise<ICampaign[]> {
    try {
<<<<<<< HEAD
      const res = await axiosInstance.get("/api/campaigns");
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend campaigns fetch error:", err);
=======
      const res = await axiosInstance.get("/api/campaigns/business/biz-pg-01");
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch {
      // Graceful fallback to mock store
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    }

    let list = mockStore.getCampaigns();
    if (filters?.status && filters.status !== "all") {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.type && filters.type !== "all") {
      list = list.filter((c) => c.type === filters.type);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.product?.toLowerCase().includes(s)
      );
    }
    return list;
  },

  // GET single campaign by ID
  async getCampaignById(id: string): Promise<ICampaign> {
    try {
      const res = await axiosInstance.get(`/api/campaigns/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const list = mockStore.getCampaigns();
    const found = list.find((c) => c._id === id);
    if (!found) {
      throw new Error(`Campaign with ID ${id} not found.`);
    }
    return found;
  },

  // CREATE campaign
  async createCampaign(payload: Partial<ICampaign>): Promise<ICampaign> {
    const newCampaign: ICampaign = {
      _id: `camp-${Date.now()}`,
      name: payload.name || "Untitled Campaign",
      description: payload.description || "",
      businessId: payload.businessId || "biz-pg-01",
      businessName: payload.businessName || "Procter & Gamble Consumer Insights",
      type: payload.type || ("survey" as any),
      status: CampaignStatus.DRAFT,
      product: payload.product || "Core Product",
      startDate: payload.startDate || new Date().toISOString().split("T")[0],
      endDate: payload.endDate || "",
      targetAudience: payload.targetAudience || "General consumers",
      language: payload.language || "en-IN",
      createdBy: "user-insights-lead",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responsesCount: 0,
      completedResponsesCount: 0,
      completionRate: 0,
      avgDurationSeconds: 0,
      positiveIntentPercentage: 0,
      negativeIntentPercentage: 0,
      neutralIntentPercentage: 0,
    };

    try {
      const res = await axiosInstance.post("/api/campaigns", newCampaign);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const list = mockStore.getCampaigns();
    list.unshift(newCampaign);
    mockStore.saveCampaigns(list);
    return newCampaign;
  },

  // UPDATE campaign
  async updateCampaign(id: string, updates: Partial<ICampaign>): Promise<ICampaign> {
    try {
      const res = await axiosInstance.put(`/api/campaigns/${id}`, updates);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const list = mockStore.getCampaigns();
    const idx = list.findIndex((c) => c._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      mockStore.saveCampaigns(list);
      return list[idx];
    }
    throw new Error(`Campaign with ID ${id} not found.`);
  },

  // PUBLISH campaign
  async publishCampaign(id: string): Promise<ICampaign> {
    try {
      const res = await axiosInstance.post(`/api/campaigns/${id}/publish`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return this.updateCampaign(id, { status: CampaignStatus.ACTIVE });
  },

  // PAUSE campaign
  async pauseCampaign(id: string): Promise<ICampaign> {
    try {
      const res = await axiosInstance.post(`/api/campaigns/${id}/pause`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return this.updateCampaign(id, { status: CampaignStatus.PAUSED });
  },

  // ARCHIVE campaign
  async archiveCampaign(id: string): Promise<ICampaign> {
    try {
      const res = await axiosInstance.post(`/api/campaigns/${id}/archive`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return this.updateCampaign(id, { status: CampaignStatus.ARCHIVED });
  },

  // DELETE campaign
  async deleteCampaign(id: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/api/campaigns/${id}`);
    } catch {
      // Fallback
    }

    const list = mockStore.getCampaigns();
    const filtered = list.filter((c) => c._id !== id);
    mockStore.saveCampaigns(filtered);
    return true;
  },

  // ATTACH survey
  async attachSurvey(campaignId: string, surveyId: string): Promise<ICampaign> {
    try {
      const res = await axiosInstance.post(`/api/campaigns/${campaignId}/survey`, { surveyId });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return this.updateCampaign(campaignId, { surveyId });
  },
<<<<<<< HEAD

  // AI GENERATE campaign
  async generateAICampaign(payload: {
    goal: string;
    targetAudience?: string;
    action?: string;
    productContext?: string;
    productId?: string;
    createLinkedSurvey?: boolean;
    businessName?: string;
  }): Promise<{ campaign: ICampaign; linkedSurvey?: any; outreachScript?: string; attachedLeadsCount?: number }> {
    const res = await axiosInstance.post("/api/campaigns/generate", payload);
    return res.data?.data;
  },

  // AI EDIT campaign
  async editAICampaign(campaignId: string, instructions: string): Promise<ICampaign> {
    const res = await axiosInstance.put(`/api/campaigns/${campaignId}/ai-edit`, { instructions });
    return res.data?.data;
  },

  // ADD LEADS to campaign
  async addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<{ addedCount: number; totalLeadsInCampaign: number }> {
    const res = await axiosInstance.post(`/api/campaigns/${campaignId}/leads`, { leadIds });
    return res.data?.data;
  },

  // CALL LEAD with AI Voice
  async callLeadWithAI(payload: {
    campaignId: string;
    leadId: string;
    customerReply?: string;
    conversationId?: string;
    surveySessionId?: string;
    surveyId?: string;
  }): Promise<{
    campaignId?: string;
    leadId?: string;
    leadName?: string;
    leadPhone?: string;
    conversationId: string;
    surveyId?: string;
    surveyName?: string;
    surveySessionId?: string;
    currentQuestionId?: string;
    currentQuestionIndex?: number;
    totalQuestions?: number;
    completed?: boolean;
    answers?: any[];
    questions?: any[];
    openingSpeech: string;
    audioBase64: string;
    mimeType: string;
    sources?: any[];
    toolsUsed?: string[];
    status: string;
  }> {
    const res = await axiosInstance.post(
      `/api/campaigns/${payload.campaignId}/call-lead`,
      {
        leadId: payload.leadId,
        customerReply: payload.customerReply,
        conversationId: payload.conversationId,
        surveySessionId: payload.surveySessionId,
        surveyId: payload.surveyId,
      },
      { timeout: 60000 }
    );
    return res.data?.data;
  },
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
};
