import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadApi, ILead } from "../api/leadApi";
import { CAMPAIGN_KEYS } from "../../campaigns/hooks/useCampaigns";

export const LEADS_KEY = ["leads"];

export function useLeads(campaignId?: string) {
  return useQuery<ILead[]>({
    queryKey: [...LEADS_KEY, campaignId || "all"],
    queryFn: () => leadApi.getLeads(campaignId),
  });
}

export function useLead(id: string) {
  return useQuery<ILead | null>({
    queryKey: [...LEADS_KEY, id],
    queryFn: () => leadApi.getLead(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead: Partial<ILead> & { campaignId?: string }) => leadApi.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leads, campaignId }: { leads: Array<Partial<ILead>>; campaignId?: string }) =>
      leadApi.importLeads(leads, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ILead> }) =>
      leadApi.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadApi.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_KEY });
    },
  });
}

