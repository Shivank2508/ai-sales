import { useQuery } from "@tanstack/react-query";
import { conversationApi } from "../api/conversationApi";

export const CONVERSATION_KEYS = {
  all: ["conversations"] as const,
  byCampaign: (campaignId: string) => [...CONVERSATION_KEYS.all, "byCampaign", campaignId] as const,
  detail: (id: string) => [...CONVERSATION_KEYS.all, "detail", id] as const,
};

export const useConversations = (campaignId?: string) => {
  return useQuery({
    queryKey: campaignId ? CONVERSATION_KEYS.byCampaign(campaignId) : CONVERSATION_KEYS.all,
    queryFn: () =>
      campaignId
        ? conversationApi.getConversationsByCampaign(campaignId)
        : conversationApi.getAllConversations(),
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: CONVERSATION_KEYS.detail(id),
    queryFn: () => conversationApi.getConversationById(id),
    enabled: Boolean(id),
  });
};
