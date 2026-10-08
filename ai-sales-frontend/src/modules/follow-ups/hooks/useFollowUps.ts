import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { followUpApi, IFollowUpTask } from "../api/followUpApi";

export const FOLLOW_UPS_KEY = ["follow-ups"];

export function useFollowUps(productId: string) {
  return useQuery<IFollowUpTask[]>({
    queryKey: [...FOLLOW_UPS_KEY, productId],
    queryFn: () => followUpApi.getPendingByProduct(productId),
    enabled: !!productId,
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followUpId, notes }: { followUpId: string; notes?: string }) =>
      followUpApi.completeFollowUp(followUpId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
    },
  });
}

export function useCancelFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followUpId, reason }: { followUpId: string; reason?: string }) =>
      followUpApi.cancelFollowUp(followUpId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
    },
  });
}
