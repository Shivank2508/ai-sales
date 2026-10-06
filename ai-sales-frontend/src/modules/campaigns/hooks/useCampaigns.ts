import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignApi } from "../api/campaignApi";
import { ICampaign } from "../../../types";

export const CAMPAIGN_KEYS = {
  all: ["campaigns"] as const,
  list: (filters?: any) => [...CAMPAIGN_KEYS.all, "list", filters] as const,
  detail: (id: string) => [...CAMPAIGN_KEYS.all, "detail", id] as const,
};

export const useCampaigns = (filters?: { status?: string; type?: string; search?: string }) => {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.list(filters),
    queryFn: () => campaignApi.getCampaigns(filters),
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: CAMPAIGN_KEYS.detail(id),
    queryFn: () => campaignApi.getCampaignById(id),
    enabled: Boolean(id),
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ICampaign>) => campaignApi.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ICampaign> }) =>
      campaignApi.updateCampaign(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.detail(data._id) });
    },
  });
};

export const usePublishCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignApi.publishCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.detail(data._id) });
    },
  });
};

export const usePauseCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignApi.pauseCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.detail(data._id) });
    },
  });
};

export const useArchiveCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignApi.archiveCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.detail(data._id) });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
    },
  });
};
