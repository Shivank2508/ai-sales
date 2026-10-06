import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentApi } from "../api/agentApi";
import { IAIAgent } from "../../../types";

export const AGENT_KEYS = {
  all: ["agents"] as const,
  detail: (id: string) => [...AGENT_KEYS.all, "detail", id] as const,
};

export const useAIAgents = () => {
  return useQuery({
    queryKey: AGENT_KEYS.all,
    queryFn: () => agentApi.getAgents(),
  });
};

export const useAIAgent = (id: string) => {
  return useQuery({
    queryKey: AGENT_KEYS.detail(id),
    queryFn: () => agentApi.getAgentById(id),
    enabled: Boolean(id),
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IAIAgent> }) =>
      agentApi.updateAgent(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.detail(data._id) });
    },
  });
};

export const useAssignCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, campaignId }: { agentId: string; campaignId: string }) =>
      agentApi.assignCampaign(agentId, campaignId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.detail(data._id) });
    },
  });
};
