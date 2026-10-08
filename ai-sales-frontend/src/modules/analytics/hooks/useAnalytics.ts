import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../api/analyticsApi";

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    refetchInterval: 30000,
  });
};

export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery({
    queryKey: ["analytics", "campaign", campaignId],
    queryFn: () => analyticsApi.getCampaignAnalytics(campaignId),
    enabled: Boolean(campaignId),
  });
};

export const useSurveyAnalytics = (surveyId: string) => {
  return useQuery({
    queryKey: ["analytics", "survey", surveyId],
    queryFn: () => analyticsApi.getSurveyAnalytics(surveyId),
    enabled: Boolean(surveyId),
  });
};

export const useAgentAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "agent"],
    queryFn: () => analyticsApi.getAgentAnalytics(),
  });
};

export const useLead360 = (leadId: string) => {
  return useQuery({
    queryKey: ["analytics", "lead360", leadId],
    queryFn: () => analyticsApi.getLead360(leadId),
    enabled: Boolean(leadId),
  });
};

export const useBusinessInsights = () => {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => analyticsApi.getInsights(),
    staleTime: 60000,
  });
};

export const useGenerateInsights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyticsApi.generateInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
};

export const useProductAnalytics = (productId: string) => {
  return useQuery({
    queryKey: ["analytics", "product", productId],
    queryFn: () => analyticsApi.getProductAnalytics(productId),
    enabled: Boolean(productId),
  });
};
