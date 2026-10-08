import { axiosInstance } from "../../../services/api/apiClient";
import { mockStore } from "../../../services/api/mockDataStore";
import { IAIAgent } from "../../../types";

export interface IChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface IAgentChatResponse {
  reply: string;
  conversationId?: string;
  toolCalls?: any[];
}

export const agentApi = {
  // GET all AI agents
  async getAgents(): Promise<IAIAgent[]> {
    try {
      const res = await axiosInstance.get("/api/agents");
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return mockStore.getAgents();
  },

  // GET agent by ID
  async getAgentById(id: string): Promise<IAIAgent> {
    try {
      const res = await axiosInstance.get(`/api/agents/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    const list = mockStore.getAgents();
    const found = list.find((a) => a._id === id);
    if (!found) {
      throw new Error(`Agent with ID ${id} not found.`);
    }
    return found;
  },

  // UPDATE agent
  async updateAgent(id: string, updates: Partial<IAIAgent>): Promise<IAIAgent> {
    try {
      const res = await axiosInstance.put(`/api/agents/${id}`, updates);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    const list = mockStore.getAgents();
    const idx = list.findIndex((a) => a._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      mockStore.saveAgents(list);
      return list[idx];
    }
    throw new Error(`Agent with ID ${id} not found.`);
  },

  // ASSIGN campaign to agent
  async assignCampaign(agentId: string, campaignId: string): Promise<IAIAgent> {
    return this.updateAgent(agentId, { assignedCampaignIds: [campaignId] });
  },

  // SEND chat message to backend LangGraph / Agent
  async sendChatMessage(params: {
    message?: string;
    question?: string;
    productId?: string;
    productID?: string;
    conversationId?: string;
    leadId?: string;
  }): Promise<IAgentChatResponse> {
    const payload = {
      productId: params.productId || params.productID,
      question: params.question || params.message,
      conversationId: params.conversationId,
      leadId: params.leadId,
    };
    const res = await axiosInstance.post("/api/agent/chat", payload);
    return res.data?.data || res.data;
  },

  // GET conversation history
  async getConversation(id: string): Promise<any> {
    try {
      const res = await axiosInstance.get(`/api/chat/conversation/${id}`);
      return res.data?.data;
    } catch (err) {
      console.warn("Backend getConversation error:", err);
      return null;
    }
  },

  // GET product conversations
  async getProductConversations(productId: string): Promise<any[]> {
    try {
      const res = await axiosInstance.get(`/api/chat/product/${productId}`);
      return res.data?.data || [];
    } catch (err) {
      console.warn("Backend getProductConversations error:", err);
      return [];
    }
  },
};
