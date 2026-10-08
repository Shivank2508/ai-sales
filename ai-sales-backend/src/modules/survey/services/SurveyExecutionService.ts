import mongoose from "mongoose";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { SurveyQuestionRepository } from "../repositories/SurveyQuestionRepository";
import { SurveyResponseRepository } from "../repositories/SurveyResponseRepository";
import { SurveyFlowService } from "./SurveyFlowService";
import { AIAnswerExtractionService, ExtractedAnswerResult } from "./AIAnswerExtractionService";
import {
    ISurveyAnswer,
    ISurveyResponse,
    SurveyResponseStatus,
} from "../models/SurveyResponse.model";
import { ISurveyQuestion, QuestionAction, QuestionType } from "../models/SurveyQuestion.model";

export interface StartSurveySessionParams {
    surveyId: string;
    campaignId?: string;
    leadId?: string;
    respondentId?: string;
    conversationId?: string;
    metadata?: Record<string, unknown>;
}

export interface SubmitAnswerParams {
    questionId: string;
    rawAnswer?: string;
    normalizedAnswer?: any;
    answerType?: string;
    confidence?: number;
    extractedBy?: "customer" | "ai";
}

export interface SurveyExecutionResult {
    completed: boolean;
    currentQuestion?: ISurveyQuestion | null;
    nextQuestion?: ISurveyQuestion | null;
    session: ISurveyResponse;
    extractedResult?: ExtractedAnswerResult;
}

export class SurveyExecutionService {
    constructor(
        private readonly surveyRepository = new SurveyRepository(),
        private readonly questionRepository = new SurveyQuestionRepository(),
        private readonly responseRepository = new SurveyResponseRepository(),
        private readonly flowService = new SurveyFlowService(),
        private readonly aiExtractionService = new AIAnswerExtractionService()
    ) {}

    async startSurvey(params: StartSurveySessionParams): Promise<{
        session: ISurveyResponse;
        firstQuestion: ISurveyQuestion;
    }> {
        const survey = await this.surveyRepository.findById(params.surveyId);
        if (!survey) {
            throw new Error(`Survey with ID ${params.surveyId} not found`);
        }

        const firstQuestion = await this.questionRepository.findFirstQuestion(params.surveyId);
        if (!firstQuestion) {
            throw new Error(`Survey ${params.surveyId} does not contain any questions`);
        }

        const surveyIdObj = new mongoose.Types.ObjectId(params.surveyId);
        const campaignIdObj = params.campaignId && mongoose.Types.ObjectId.isValid(params.campaignId)
            ? new mongoose.Types.ObjectId(params.campaignId)
            : survey.campaignId;
        const leadIdObj = params.leadId && mongoose.Types.ObjectId.isValid(params.leadId)
            ? new mongoose.Types.ObjectId(params.leadId)
            : undefined;
        const conversationIdObj = params.conversationId && mongoose.Types.ObjectId.isValid(params.conversationId)
            ? new mongoose.Types.ObjectId(params.conversationId)
            : undefined;

        // Check if active session already exists for this respondent / lead / conversation
        let existingSession: any = null;
        if (params.conversationId) {
            existingSession = await this.responseRepository.findByConversationId(params.conversationId);
        } else if (params.leadId) {
            existingSession = await this.responseRepository.findByLeadAndSurvey(params.surveyId, params.leadId);
        } else if (params.respondentId) {
            existingSession = await this.responseRepository.findByRespondentId(params.surveyId, params.respondentId);
        }

        if (
            existingSession &&
            (existingSession.status === SurveyResponseStatus.IN_PROGRESS ||
                existingSession.status === SurveyResponseStatus.STARTED)
        ) {
            const currentQ = existingSession.currentQuestionId
                ? await this.questionRepository.findByQuestionId(
                      params.surveyId,
                      existingSession.currentQuestionId
                  )
                : firstQuestion;

            return {
                session: existingSession.toObject(),
                firstQuestion: currentQ || firstQuestion,
            };
        }

        const newSession = await this.responseRepository.create({
            surveyId: surveyIdObj,
            surveyVersionId: (survey as any).versionId || undefined,
            version: survey.version || 1,
            campaignId: campaignIdObj,
            leadId: leadIdObj,
            respondentId: params.respondentId || (params.leadId ? `lead_${params.leadId}` : `anon_${Date.now()}`),
            conversationId: conversationIdObj,
            status: SurveyResponseStatus.IN_PROGRESS,
            currentQuestionId: firstQuestion.questionId,
            answers: [],
            completionPercentage: 0,
            startedAt: new Date(),
            metadata: params.metadata || {},
        });

        return {
            session: newSession.toObject(),
            firstQuestion,
        };
    }

    async getSurveySession(sessionId: string): Promise<ISurveyResponse | null> {
        const session = await this.responseRepository.findById(sessionId);
        return session ? session.toObject() : null;
    }

    async getCurrentQuestion(sessionId: string): Promise<ISurveyQuestion | null> {
        const session = await this.responseRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        if (!session.currentQuestionId) {
            return null;
        }

        return this.questionRepository.findByQuestionId(
            session.surveyId.toString(),
            session.currentQuestionId
        );
    }

    /**
     * Extracts structured answer from natural language text for a given survey question
     */
    async extractAnswer(
        surveyId: string,
        questionId: string,
        rawAnswer: string
    ): Promise<ExtractedAnswerResult> {
        const question = await this.questionRepository.findByQuestionId(surveyId, questionId);
        if (!question) {
            throw new Error(`Question ${questionId} not found in survey ${surveyId}`);
        }

        return this.aiExtractionService.extractAnswer(question, rawAnswer);
    }

    /**
     * Submits a natural language answer with automatic AI extraction and validation
     */
    async submitNaturalLanguageAnswer(
        sessionId: string,
        questionId: string,
        rawAnswer: string
    ): Promise<SurveyExecutionResult> {
        const session = await this.responseRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        const currentQuestion = await this.questionRepository.findByQuestionId(
            session.surveyId.toString(),
            questionId
        );
        if (!currentQuestion) {
            throw new Error(`Question ${questionId} not found in survey`);
        }

        const extracted = await this.aiExtractionService.extractAnswer(currentQuestion, rawAnswer);

        if (extracted.skipped) {
            return this.skipQuestion(sessionId, questionId);
        }

        const result = await this.submitAnswer(sessionId, {
            questionId,
            rawAnswer: extracted.rawAnswer,
            normalizedAnswer: extracted.normalizedAnswer,
            answerType: extracted.answerType,
            confidence: extracted.confidence,
            extractedBy: "ai",
        });

        result.extractedResult = extracted;
        return result;
    }

    async submitAnswer(
        sessionId: string,
        answerInput: SubmitAnswerParams
    ): Promise<SurveyExecutionResult> {
        const session = await this.responseRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        if (
            session.status === SurveyResponseStatus.COMPLETED ||
            session.status === SurveyResponseStatus.ABANDONED ||
            session.status === SurveyResponseStatus.FAILED
        ) {
            throw new Error(`Cannot submit answer. Session is already ${session.status}`);
        }

        const currentQuestion = await this.questionRepository.findByQuestionId(
            session.surveyId.toString(),
            answerInput.questionId
        );

        if (!currentQuestion) {
            throw new Error(`Question ${answerInput.questionId} not found in survey`);
        }

        let normalizedAnswer = answerInput.normalizedAnswer;
        let answerType = answerInput.answerType || (currentQuestion.type as string);
        let confidence = answerInput.confidence !== undefined ? answerInput.confidence : 1.0;
        let extractedBy = answerInput.extractedBy || "customer";

        // Auto-extract if raw answer given without normalized value and extraction requested or needed
        if (
            normalizedAnswer === undefined &&
            answerInput.rawAnswer !== undefined &&
            (extractedBy === "ai" ||
                (currentQuestion.type !== QuestionType.TEXT && currentQuestion.type !== "text" && currentQuestion.type !== "long_text"))
        ) {
            try {
                const aiResult = await this.aiExtractionService.extractAnswer(
                    currentQuestion,
                    answerInput.rawAnswer
                );
                normalizedAnswer = aiResult.normalizedAnswer;
                answerType = aiResult.answerType;
                confidence = aiResult.confidence;
                extractedBy = "ai";
            } catch (err) {
                normalizedAnswer = answerInput.rawAnswer;
            }
        }

        const answer: ISurveyAnswer = {
            questionId: answerInput.questionId,
            rawAnswer: answerInput.rawAnswer,
            normalizedAnswer: normalizedAnswer !== undefined ? normalizedAnswer : answerInput.rawAnswer,
            answerType,
            confidence,
            extractedBy,
            answeredAt: new Date(),
            skipped: false,
        };

        const updatedSession = await this.responseRepository.addAnswer(sessionId, answer);
        if (!updatedSession) {
            throw new Error(`Failed to record answer for session ${sessionId}`);
        }

        // Calculate progress
        const allQuestions = await this.questionRepository.findBySurveyId(session.surveyId.toString());
        const totalCount = allQuestions.length || 1;
        const answeredCount = updatedSession.answers.length;
        const progress = Math.min(99, Math.round((answeredCount / totalCount) * 100));
        await this.responseRepository.updateProgress(sessionId, progress);

        // Build answer map for condition evaluation
        const answersMap: Record<string, unknown> = {};
        for (const ans of updatedSession.answers) {
            const val = ans.normalizedAnswer !== undefined ? ans.normalizedAnswer : ans.rawAnswer;
            answersMap[ans.questionId] = val;
            const qObj = allQuestions.find((q) => q.questionId === ans.questionId);
            if (qObj) {
                answersMap[`order_${qObj.order}`] = val;
                answersMap[`q${qObj.order}`] = val;
            }
        }

        // Evaluate survey condition branching
        const flowResult = this.flowService.evaluateNextQuestion(currentQuestion, answersMap);

        if (flowResult.action === QuestionAction.END_SURVEY) {
            const completedSession = await this.responseRepository.complete(sessionId);
            return {
                completed: true,
                nextQuestion: null,
                session: completedSession ? completedSession.toObject() : updatedSession.toObject(),
            };
        }

        let nextQuestion: ISurveyQuestion | null = null;

        if (flowResult.nextQuestionId) {
            nextQuestion = await this.questionRepository.findByQuestionId(
                session.surveyId.toString(),
                flowResult.nextQuestionId
            );
        }

        if (!nextQuestion) {
            nextQuestion = this.findNextEligibleQuestion(
                allQuestions,
                currentQuestion.order,
                answersMap
            );
        }

        if (!nextQuestion) {
            // End of survey reached
            const completedSession = await this.responseRepository.complete(sessionId);
            return {
                completed: true,
                nextQuestion: null,
                session: completedSession ? completedSession.toObject() : updatedSession.toObject(),
            };
        }

        await this.responseRepository.updateCurrentQuestion(sessionId, nextQuestion.questionId);
        const finalSession = await this.responseRepository.findById(sessionId);

        return {
            completed: false,
            currentQuestion: nextQuestion,
            nextQuestion,
            session: finalSession ? finalSession.toObject() : updatedSession.toObject(),
        };
    }

    async skipQuestion(sessionId: string, questionId: string): Promise<SurveyExecutionResult> {
        const session = await this.responseRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        const currentQuestion = await this.questionRepository.findByQuestionId(
            session.surveyId.toString(),
            questionId
        );

        if (!currentQuestion) {
            throw new Error(`Question ${questionId} not found in survey`);
        }

        const skippedAnswer: ISurveyAnswer = {
            questionId,
            rawAnswer: "SKIPPED",
            normalizedAnswer: null,
            extractedBy: "customer",
            answeredAt: new Date(),
            skipped: true,
        };

        const updatedSession = await this.responseRepository.addAnswer(sessionId, skippedAnswer);
        if (!updatedSession) {
            throw new Error(`Failed to record skipped question for session ${sessionId}`);
        }

        const allQuestions = await this.questionRepository.findBySurveyId(session.surveyId.toString());
        const answersMap: Record<string, unknown> = {};
        for (const ans of updatedSession.answers) {
            const val = ans.normalizedAnswer !== undefined ? ans.normalizedAnswer : ans.rawAnswer;
            answersMap[ans.questionId] = val;
            const qObj = allQuestions.find((q) => q.questionId === ans.questionId);
            if (qObj) {
                answersMap[`order_${qObj.order}`] = val;
                answersMap[`q${qObj.order}`] = val;
            }
        }

        const nextQuestion = this.findNextEligibleQuestion(
            allQuestions,
            currentQuestion.order,
            answersMap
        );

        if (!nextQuestion) {
            const completedSession = await this.responseRepository.complete(sessionId);
            return {
                completed: true,
                nextQuestion: null,
                session: completedSession ? completedSession.toObject() : updatedSession.toObject(),
            };
        }

        await this.responseRepository.updateCurrentQuestion(sessionId, nextQuestion.questionId);
        const finalSession = await this.responseRepository.findById(sessionId);

        return {
            completed: false,
            currentQuestion: nextQuestion,
            nextQuestion,
            session: finalSession ? finalSession.toObject() : updatedSession.toObject(),
        };
    }

    async moveToNextQuestion(sessionId: string, nextQuestionId?: string): Promise<ISurveyQuestion | null> {
        const session = await this.responseRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        let nextQuestion: ISurveyQuestion | null = null;
        if (nextQuestionId) {
            nextQuestion = await this.questionRepository.findByQuestionId(
                session.surveyId.toString(),
                nextQuestionId
            );
        } else if (session.currentQuestionId) {
            const currentQuestion = await this.questionRepository.findByQuestionId(
                session.surveyId.toString(),
                session.currentQuestionId
            );
            if (currentQuestion) {
                nextQuestion = await this.questionRepository.findNextByOrder(
                    session.surveyId.toString(),
                    currentQuestion.order
                );
            }
        }

        if (nextQuestion) {
            await this.responseRepository.updateCurrentQuestion(sessionId, nextQuestion.questionId);
        } else {
            await this.responseRepository.complete(sessionId);
        }

        return nextQuestion;
    }

    async completeSurvey(sessionId: string): Promise<ISurveyResponse | null> {
        const session = await this.responseRepository.complete(sessionId);
        return session ? session.toObject() : null;
    }

    async abandonSurvey(sessionId: string, reason?: string): Promise<ISurveyResponse | null> {
        const session = await this.responseRepository.abandon(
            sessionId,
            reason ? { abandonReason: reason } : undefined
        );
        return session ? session.toObject() : null;
    }

    async failSurvey(sessionId: string, error?: string): Promise<ISurveyResponse | null> {
        const session = await this.responseRepository.fail(sessionId, error);
        return session ? session.toObject() : null;
    }

    private findNextEligibleQuestion(
        allQuestions: ISurveyQuestion[],
        currentOrder: number,
        answersMap: Record<string, unknown>
    ): ISurveyQuestion | null {
        const candidates = allQuestions
            .filter((q) => q.order > currentOrder)
            .sort((a, b) => a.order - b.order);

        for (const candidate of candidates) {
            if (this.isQuestionEligible(candidate, answersMap, allQuestions)) {
                return candidate;
            }
        }
        return null;
    }

    private isQuestionEligible(
        candidate: ISurveyQuestion,
        answersMap: Record<string, unknown>,
        allQuestions: ISurveyQuestion[]
    ): boolean {
        // 1. Text annotations such as:
        // "(Only if Q4 is No)"
        // "(Only if Q4 is a)"
        // "(Only if Q4 is Yes)"
        const textToInspect = `${candidate.text} ${candidate.aiPrompt || ""}`;
        const conditionMatch = textToInspect.match(/\(only if\s+(?:q(?:uestion)?\s*(\d+)|([a-z0-9_]+))\s+(?:is|=|==)\s*([^)]+)\)/i);

        if (conditionMatch) {
            const targetOrderStr = conditionMatch[1];
            const targetFieldStr = conditionMatch[2];
            const expectedCondition = (conditionMatch[3] || "").trim().toLowerCase();

            let targetQuestion: ISurveyQuestion | undefined;
            if (targetOrderStr) {
                const targetOrder = parseInt(targetOrderStr, 10);
                targetQuestion = allQuestions.find((q) => q.order === targetOrder);
            } else if (targetFieldStr) {
                targetQuestion = allQuestions.find((q) => q.questionId === targetFieldStr);
            }

            if (targetQuestion) {
                const rawAns = answersMap[targetQuestion.questionId];
                if (rawAns === undefined || rawAns === null) {
                    // Prerequisite question not answered yet
                    return false;
                }

                const ansStr = String(rawAns).trim().toLowerCase();

                // If condition specifies "no" or option "b"
                if (expectedCondition === "no" || expectedCondition === "b" || expectedCondition.includes("no")) {
                    const isNo = /^(no|b|false|negative|0)\b/i.test(ansStr) || ansStr.includes("no");
                    if (!isNo) return false;
                }
                // If condition specifies "yes" or option "a"
                else if (expectedCondition === "yes" || expectedCondition === "a" || expectedCondition.includes("yes")) {
                    const isYes = /^(yes|a|true|affirmative|1)\b/i.test(ansStr) || ansStr.includes("yes");
                    if (!isYes) return false;
                } else {
                    if (!ansStr.includes(expectedCondition) && !expectedCondition.includes(ansStr)) {
                        return false;
                    }
                }
            }
        }

        // 2. Explicit candidate.conditions referencing other questions
        if (candidate.conditions && candidate.conditions.length > 0) {
            for (const cond of candidate.conditions) {
                if (cond.field && cond.field !== candidate.questionId) {
                    const targetAns = answersMap[cond.field];
                    if (targetAns !== undefined) {
                        const matched = this.flowService.evaluateCondition(cond, targetAns);
                        if (!matched) return false;
                    }
                }
            }
        }

        return true;
    }
}
