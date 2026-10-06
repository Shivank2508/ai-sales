import { mockStore } from "../../../services/api/mockDataStore";
import { IConversation } from "../../../types";

export const conversationApi = {
  // GET conversations for a campaign
  async getConversationsByCampaign(campaignId: string): Promise<IConversation[]> {
    return mockStore.getConversations().filter((c) => c.campaignId === campaignId);
  },

  // GET all conversations
  async getAllConversations(): Promise<IConversation[]> {
    return mockStore.getConversations();
  },

  // GET single conversation
  async getConversationById(id: string): Promise<IConversation> {
    const list = mockStore.getConversations();
    const found = list.find((c) => c._id === id || c.conversationId === id);
    if (!found) {
      throw new Error(`Conversation with ID ${id} not found.`);
    }
    return found;
  },
};
