import { useQuery } from "@tanstack/react-query";
import { responseApi } from "../api/responseApi";

export const RESPONSE_KEYS = {
  all: ["responses"] as const,
  byCampaign: (campaignId: string, filters?: any) =>
    [...RESPONSE_KEYS.all, "byCampaign", campaignId, filters] as const,
  detail: (id: string) => [...RESPONSE_KEYS.all, "detail", id] as const,
};

export const useSurveyResponses = (
  campaignId: string,
  filters?: { status?: string; search?: string }
) => {
  return useQuery({
    queryKey: RESPONSE_KEYS.byCampaign(campaignId, filters),
    queryFn: () => responseApi.getResponsesByCampaign(campaignId, filters),
    enabled: Boolean(campaignId),
  });
};

export const useSurveyResponse = (responseId: string) => {
  return useQuery({
    queryKey: RESPONSE_KEYS.detail(responseId),
    queryFn: () => responseApi.getResponseById(responseId),
    enabled: Boolean(responseId),
  });
};
