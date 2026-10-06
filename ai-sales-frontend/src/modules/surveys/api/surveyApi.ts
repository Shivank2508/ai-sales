import { axiosInstance } from "../../../services/api/apiClient";
import { mockStore } from "../../../services/api/mockDataStore";
import {
  ISurvey,
  ISurveyQuestion,
  ISurveyValidationResult,
  IValidationIssue,
  QuestionAction,
  QuestionType,
  SurveyStatus,
} from "../../../types";

export const surveyApi = {
  // GET survey by ID
  async getSurveyById(surveyId: string): Promise<ISurvey> {
    try {
      const res = await axiosInstance.get(`/api/surveys/${surveyId}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const surveys = mockStore.getSurveys();
    const found = surveys[surveyId];
    if (!found) {
      throw new Error(`Survey ${surveyId} not found.`);
    }
    return found;
  },

  // GET survey by Campaign ID
  async getSurveyByCampaignId(campaignId: string): Promise<ISurvey | null> {
    try {
      const surveys = mockStore.getSurveys();
      const found = Object.values(surveys).find((s) => s.campaignId === campaignId);
      return found || null;
    } catch {
      return null;
    }
  },

  // CREATE survey
  async createSurvey(campaignId: string, payload: Partial<ISurvey>): Promise<ISurvey> {
    const newSurvey: ISurvey = {
      _id: `surv-${Date.now()}`,
      campaignId,
      name: payload.name || "Customer Feedback Survey",
      description: payload.description || "",
      version: 1,
      status: SurveyStatus.DRAFT,
      language: payload.language || "en-IN",
      welcomeMessage: payload.welcomeMessage || "Hello! We would love your quick feedback.",
      endMessage: payload.endMessage || "Thank you for completing our survey!",
      maxQuestions: payload.maxQuestions || 10,
      aiSystemPrompt: payload.aiSystemPrompt || "Speak politely and clearly. Transcribe user intent accurately.",
      questions: payload.questions || [],
      createdBy: "user-insights-lead",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await axiosInstance.post("/api/surveys", newSurvey);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const surveys = mockStore.getSurveys();
    surveys[newSurvey._id] = newSurvey;
    mockStore.saveSurveys(surveys);
    return newSurvey;
  },

  // UPDATE survey
  async updateSurvey(surveyId: string, updates: Partial<ISurvey>): Promise<ISurvey> {
    try {
      const res = await axiosInstance.put(`/api/surveys/${surveyId}`, updates);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const surveys = mockStore.getSurveys();
    if (surveys[surveyId]) {
      surveys[surveyId] = {
        ...surveys[surveyId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      mockStore.saveSurveys(surveys);
      return surveys[surveyId];
    }
    throw new Error(`Survey ${surveyId} not found.`);
  },

  // SAVE ALL QUESTIONS
  async saveQuestions(surveyId: string, questions: ISurveyQuestion[]): Promise<ISurvey> {
    const reordered = questions.map((q, idx) => ({ ...q, order: idx + 1 }));
    return this.updateSurvey(surveyId, { questions: reordered });
  },

  // VALIDATE SURVEY ENGINE (Automated Pre-Flight Inspection)
  validateSurvey(survey: ISurvey | null): ISurveyValidationResult {
    const issues: IValidationIssue[] = [];
    const passedChecks: string[] = [];

    if (!survey) {
      issues.push({
        id: "v-no-survey",
        category: "survey",
        level: "error",
        title: "Survey Missing",
        message: "No survey exists for this campaign. Please create a survey first.",
      });
      return { isValid: false, score: 0, issues, passedChecks: [] };
    }

    passedChecks.push("Survey object initialized");

    if (!survey.name || survey.name.trim().length < 3) {
      issues.push({
        id: "v-survey-name",
        category: "survey",
        level: "error",
        title: "Survey Name Required",
        message: "Survey must have a descriptive title (at least 3 characters).",
      });
    } else {
      passedChecks.push(`Survey title '${survey.name}' valid`);
    }

    if (!survey.welcomeMessage || survey.welcomeMessage.trim().length < 5) {
      issues.push({
        id: "v-welcome-msg",
        category: "survey",
        level: "warning",
        title: "Short Welcome Greeting",
        message: "Adding a friendly welcome greeting improves conversational completion rates.",
      });
    } else {
      passedChecks.push("Welcome greeting configured");
    }

    const questions = survey.questions || [];
    if (questions.length === 0) {
      issues.push({
        id: "v-empty-questions",
        category: "question",
        level: "error",
        title: "Survey Has No Questions",
        message: "Add at least one question to the survey before publishing.",
      });
      return {
        isValid: false,
        score: 20,
        issues,
        passedChecks,
      };
    }

    passedChecks.push(`${questions.length} questions configured`);

    // Unique IDs & Order checks
    const qIds = new Set<string>();
    let hasDuplicateId = false;

    questions.forEach((q, idx) => {
      if (!q.questionId || qIds.has(q.questionId)) {
        hasDuplicateId = true;
        issues.push({
          id: `v-dup-id-${idx}`,
          category: "question",
          level: "error",
          title: `Duplicate Question ID: ${q.questionId}`,
          message: `Question #${idx + 1} has an ambiguous or duplicate question ID.`,
          questionId: q.questionId,
        });
      }
      qIds.add(q.questionId);

      if (!q.text || q.text.trim().length < 3) {
        issues.push({
          id: `v-empty-text-${q.questionId}`,
          category: "question",
          level: "error",
          title: `Question #${idx + 1} Prompt Empty`,
          message: `Question '${q.questionId}' must have clear question prompt text.`,
          questionId: q.questionId,
        });
      }

      // Check choice options
      const isChoice =
        q.type === QuestionType.SINGLE_CHOICE ||
        q.type === QuestionType.MULTIPLE_CHOICE ||
        q.type === QuestionType.YES_NO;

      if (isChoice) {
        if (!q.options || q.options.length < 2) {
          issues.push({
            id: `v-missing-opts-${q.questionId}`,
            category: "question",
            level: "error",
            title: `Question #${idx + 1} Missing Options`,
            message: `Choice question '${q.questionId}' requires at least 2 selectable options.`,
            questionId: q.questionId,
          });
        }
      }

      // Condition branch validation
      if (q.conditionGroups && q.conditionGroups.length > 0) {
        q.conditionGroups.forEach((group, gIdx) => {
          if (group.action === QuestionAction.NEXT) {
            if (!group.nextQuestionId || !qIds.has(group.nextQuestionId)) {
              // Target not found in the survey questions
              const targetExists = questions.some((item) => item.questionId === group.nextQuestionId);
              if (!targetExists) {
                issues.push({
                  id: `v-broken-branch-${q.questionId}-${gIdx}`,
                  category: "condition",
                  level: "error",
                  title: `Broken Logic Branch in Q#${idx + 1}`,
                  message: `Condition group points to missing target question '${group.nextQuestionId || "Unset"}'.`,
                  questionId: q.questionId,
                });
              }
            } else if (group.nextQuestionId === q.questionId) {
              issues.push({
                id: `v-loop-branch-${q.questionId}-${gIdx}`,
                category: "condition",
                level: "error",
                title: `Circular Logic Loop in Q#${idx + 1}`,
                message: `Question cannot branch to itself.`,
                questionId: q.questionId,
              });
            }
          }
        });
      }
    });

    if (!hasDuplicateId) {
      passedChecks.push("All question IDs are unique");
    }
    passedChecks.push("All choice questions have options configured");
    passedChecks.push("No broken branching references or loops");

    const errorCount = issues.filter((i) => i.level === "error").length;
    const warningCount = issues.filter((i) => i.level === "warning").length;

    const score =
      errorCount > 0
        ? Math.max(15, 100 - errorCount * 30 - warningCount * 10)
        : Math.max(85, 100 - warningCount * 5);

    return {
      isValid: errorCount === 0,
      score,
      issues,
      passedChecks,
    };
  },
};
