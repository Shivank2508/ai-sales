import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analyticsApi";

export const useCampaignAnalytics = (campaignId: string) => {
  return useQuery({
    queryKey: ["analytics", campaignId],
    queryFn: () => analyticsApi.getCampaignAnalytics(campaignId),
    enabled: Boolean(campaignId),
  });
};
