import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveyApi } from "../api/surveyApi";
import { ISurvey, ISurveyQuestion } from "../../../types";
import { CAMPAIGN_KEYS } from "../../campaigns/hooks/useCampaigns";

export const SURVEY_KEYS = {
  all: ["surveys"] as const,
  list: (campaignId?: string) => [...SURVEY_KEYS.all, "list", campaignId || "all"] as const,
  detail: (id: string) => [...SURVEY_KEYS.all, "detail", id] as const,
  byCampaign: (campaignId: string) => [...SURVEY_KEYS.all, "byCampaign", campaignId] as const,
};

export const useSurveys = (campaignId?: string) => {
  return useQuery({
    queryKey: SURVEY_KEYS.list(campaignId),
    queryFn: () => surveyApi.getAllSurveys(campaignId),
  });
};


export const useSurvey = (surveyId?: string) => {
  return useQuery({
    queryKey: SURVEY_KEYS.detail(surveyId || ""),
    queryFn: () => surveyApi.getSurveyById(surveyId!),
    enabled: Boolean(surveyId),
  });
};

export const useSurveyByCampaign = (campaignId?: string) => {
  return useQuery({
    queryKey: SURVEY_KEYS.byCampaign(campaignId || ""),
    queryFn: () => surveyApi.getSurveyByCampaignId(campaignId!),
    enabled: Boolean(campaignId),
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, payload }: { campaignId: string; payload: Partial<ISurvey> }) =>
      surveyApi.createSurvey(campaignId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_KEYS.all });
    },
  });
};

export const useUpdateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, updates }: { surveyId: string; updates: Partial<ISurvey> }) =>
      surveyApi.updateSurvey(surveyId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.byCampaign(data.campaignId) });
    },
  });
};

export const useSaveQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, questions }: { surveyId: string; questions: ISurveyQuestion[] }) =>
      surveyApi.saveQuestions(surveyId, questions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.detail(data._id) });
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.byCampaign(data.campaignId) });
    },
  });
};

export const useGenerateAISurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      topic: string;
      targetAudience?: string;
      questionCount?: number;
      channel?: string;
      productId?: string;
      campaignId?: string;
    }) => surveyApi.generateAISurvey(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      if (data?.survey?.campaignId) {
        queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.byCampaign(data.survey.campaignId) });
      }
    },
  });
};

export const useUploadSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      file?: File;
      content?: string;
      name?: string;
      campaignId?: string;
      channel?: string;
    }) => surveyApi.uploadSurvey(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      if (data?.survey?.campaignId) {
        queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.byCampaign(data.survey.campaignId) });
      }
    },
  });
};

export const useImportQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string;
      payload: { file?: File; content?: string; append?: boolean };
    }) => surveyApi.importQuestions(surveyId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      if (data?.survey?._id) {
        queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.detail(data.survey._id) });
      }
    },
  });
};

export const useEditAISurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, instructions }: { surveyId: string; instructions: string }) =>
      surveyApi.editAISurvey(surveyId, instructions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.all });
      if (data?.survey?._id) {
        queryClient.invalidateQueries({ queryKey: SURVEY_KEYS.detail(data.survey._id) });
      }
    },
  });
};

export const useSynthesizeVoice = () => {
  return useMutation({
    mutationFn: (text: string) => surveyApi.synthesizeVoice(text),
  });
};
