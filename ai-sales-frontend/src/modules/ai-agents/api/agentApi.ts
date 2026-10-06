import { mockStore } from "../../../services/api/mockDataStore";
import { IAIAgent } from "../../../types";

export const agentApi = {
  // GET all AI agents
  async getAgents(): Promise<IAIAgent[]> {
    return mockStore.getAgents();
  },

  // GET single agent
  async getAgentById(id: string): Promise<IAIAgent> {
    const list = mockStore.getAgents();
    const found = list.find((a) => a._id === id || a.agentId === id);
    if (!found) {
      throw new Error(`Agent with ID ${id} not found.`);
    }
    return found;
  },

  // UPDATE agent
  async updateAgent(id: string, updates: Partial<IAIAgent>): Promise<IAIAgent> {
    const list = mockStore.getAgents();
    const idx = list.findIndex((a) => a._id === id || a.agentId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      mockStore.saveAgents(list);
      return list[idx];
    }
    throw new Error(`Agent ${id} not found.`);
  },

  // ASSIGN agent to campaign
  async assignCampaign(agentId: string, campaignId: string): Promise<IAIAgent> {
    const agent = await this.getAgentById(agentId);
    const assigned = new Set(agent.assignedCampaignIds || []);
    assigned.add(campaignId);
    return this.updateAgent(agent._id, { assignedCampaignIds: Array.from(assigned) });
  },
};
