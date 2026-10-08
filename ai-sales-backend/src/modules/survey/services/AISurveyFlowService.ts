import mongoose from "mongoose";
import { SurveyQuestionRepository } from "../repositories/SurveyQuestionRepository";
import { SurveyResponseRepository } from "../repositories/SurveyResponseRepository";
import { SurveyFlowService } from "./SurveyFlowService";
import { AIAnswerExtractionService, ExtractedAnswerResult } from "./AIAnswerExtractionService";
import { SurveyExecutionService, SurveyExecutionResult } from "./SurveyExecutionService";
import { ISurveyQuestion, QuestionAction } from "../models/SurveyQuestion.model";
import { ISurveyResponse, SurveyResponseStatus } from "../models/SurveyResponse.model";
import { LLMService } from "../../../services/llm.service";

export interface AISurveyTurnParams {
    sessionId: string;
    customerMessage: string;
    conversationContext?: {
        leadName?: string;
        productName?: string;
        channel?: "CHAT" | "VOICE";
    };
}

export interface AISurveyTurnResult {
    sessionId: string;
    status: "IN_PROGRESS" | "CLARIFICATION_NEEDED" | "COMPLETED" | "SKIPPED";
    currentQuestion: ISurveyQuestion | null;
    nextQuestion: ISurveyQuestion | null;
    extractedAnswer?: ExtractedAnswerResult;
    agentMessage: string;
    clarificationPrompt?: string;
    completed: boolean;
    completionPercentage: number;
    session: ISurveyResponse;
}

export class AISurveyFlowService {
    constructor(
        private readonly questionRepository = new SurveyQuestionRepository(),
        private readonly responseRepository = new SurveyResponseRepository(),
        private readonly flowService = new SurveyFlowService(),
        private readonly extractionService = new AIAnswerExtractionService(),
        private readonly executionService = new SurveyExecutionService()
    ) {}

    /**
     * Processes a natural language turn from the customer in an active survey session.
     * Manages answer interpretation, validation, clarification, condition evaluation, and next question prompting.
     */
    public async processTurn(params: AISurveyTurnParams): Promise<AISurveyTurnResult> {
        const { sessionId, customerMessage, conversationContext } = params;
        const session = await this.responseRepository.findById(sessionId);

        if (!session) {
            throw new Error(`Survey session ${sessionId} not found`);
        }

        if (session.status === SurveyResponseStatus.COMPLETED) {
            return {
                sessionId,
                status: "COMPLETED",
                currentQuestion: null,
                nextQuestion: null,
                agentMessage: "Thank you so much! You have already completed this survey.",
                completed: true,
                completionPercentage: 100,
                session: session.toObject(),
            };
        }

        if (!session.currentQuestionId) {
            const firstQuestion = await this.questionRepository.findFirstQuestion(session.surveyId.toString());
            if (!firstQuestion) {
                const completed = await this.responseRepository.complete(sessionId);
                return {
                    sessionId,
                    status: "COMPLETED",
                    currentQuestion: null,
                    nextQuestion: null,
                    agentMessage: "Thank you for your time!",
                    completed: true,
                    completionPercentage: 100,
                    session: completed ? completed.toObject() : session.toObject(),
                };
            }
            await this.responseRepository.updateCurrentQuestion(sessionId, firstQuestion.questionId);
            session.currentQuestionId = firstQuestion.questionId;
        }

        const currentQuestion = await this.questionRepository.findByQuestionId(
            session.surveyId.toString(),
            session.currentQuestionId
        );

        if (!currentQuestion) {
            throw new Error(`Current question ${session.currentQuestionId} not found in survey`);
        }

        // 1. Extract and validate answer with AI
        const extraction = await this.extractionService.extractAnswer(currentQuestion, customerMessage);

        // 2. Check if clarification is needed (e.g. low confidence or ambiguous selection)
        if (extraction.needsClarification && extraction.confidence < 0.65) {
            const clarificationMessage =
                extraction.clarificationPrompt ||
                `Just to make sure I noted that down accurately, could you clarify your answer regarding "${currentQuestion.text}"?`;

            return {
                sessionId,
                status: "CLARIFICATION_NEEDED",
                currentQuestion,
                nextQuestion: currentQuestion,
                extractedAnswer: extraction,
                agentMessage: clarificationMessage,
                clarificationPrompt: clarificationMessage,
                completed: false,
                completionPercentage: session.completionPercentage || 0,
                session: session.toObject(),
            };
        }

        // 3. If skipped
        if (extraction.skipped) {
            const skipResult = await this.executionService.skipQuestion(sessionId, currentQuestion.questionId);
            const agentPrompt = await this.generateAgentPromptForNextQuestion(
                skipResult.nextQuestion,
                conversationContext
            );

            return {
                sessionId,
                status: "SKIPPED",
                currentQuestion: skipResult.nextQuestion || null,
                nextQuestion: skipResult.nextQuestion || null,
                extractedAnswer: extraction,
                agentMessage: `No problem, skipping that. ${agentPrompt}`,
                completed: skipResult.completed,
                completionPercentage: skipResult.session.completionPercentage || 0,
                session: skipResult.session,
            };
        }

        // 4. Submit normalized answer and evaluate conditional branching
        const submitResult = await this.executionService.submitAnswer(sessionId, {
            questionId: currentQuestion.questionId,
            rawAnswer: extraction.rawAnswer,
            normalizedAnswer: extraction.normalizedAnswer,
            answerType: extraction.answerType,
            confidence: extraction.confidence,
            extractedBy: "ai",
        });

        // 5. Generate conversational prompt for the next question or completion message
        let agentMessage = "";
        if (submitResult.completed || !submitResult.nextQuestion) {
            agentMessage = "Thank you so much for sharing your feedback! That covers all our questions today.";
        } else {
            agentMessage = await this.generateAgentPromptForNextQuestion(
                submitResult.nextQuestion,
                conversationContext
            );
        }

        return {
            sessionId,
            status: submitResult.completed ? "COMPLETED" : "IN_PROGRESS",
            currentQuestion: submitResult.nextQuestion || null,
            nextQuestion: submitResult.nextQuestion || null,
            extractedAnswer: extraction,
            agentMessage,
            completed: submitResult.completed,
            completionPercentage: submitResult.session.completionPercentage || 0,
            session: submitResult.session,
        };
    }

    /**
     * Formats the survey question into a natural conversational prompt for the voice/chat agent
     */
    public async generateAgentPromptForNextQuestion(
        question: ISurveyQuestion | null | undefined,
        context?: { leadName?: string; productName?: string; channel?: "CHAT" | "VOICE" }
    ): Promise<string> {
        if (!question) {
            return "Thank you for completing the survey!";
        }

        const optionsText =
            question.options && question.options.length > 0
                ? ` (Options: ${question.options.map((o) => o.label).join(", ")})`
                : "";

        return `${question.text}${optionsText}`;
    }
}
