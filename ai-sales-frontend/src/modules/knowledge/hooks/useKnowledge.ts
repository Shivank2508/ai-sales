import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeApi, IKnowledgeItem } from "../api/knowledgeApi";

export const KNOWLEDGE_KEY = ["knowledge"];

export function useKnowledge(filter?: { campaignId?: string; productId?: string } | string) {
  const campaignId = typeof filter === "string" ? filter : filter?.campaignId;
  const productId = typeof filter === "object" ? filter?.productId : undefined;

  return useQuery<IKnowledgeItem[]>({
    queryKey: [...KNOWLEDGE_KEY, campaignId, productId],
    queryFn: () => knowledgeApi.getKnowledgeItems(campaignId, productId),
  });
}

export function useKnowledgeItem(id: string) {
  return useQuery<IKnowledgeItem | null>({
    queryKey: [...KNOWLEDGE_KEY, id],
    queryFn: () => knowledgeApi.getKnowledgeItem(id),
    enabled: !!id,
  });
}

export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<IKnowledgeItem>) => knowledgeApi.createKnowledgeItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
  });
}

export function useDeleteKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => knowledgeApi.deleteKnowledgeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, productId, campaignId }: { file: File; productId?: string; campaignId?: string }) =>
      knowledgeApi.uploadDocument(file, productId, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
  });
}

