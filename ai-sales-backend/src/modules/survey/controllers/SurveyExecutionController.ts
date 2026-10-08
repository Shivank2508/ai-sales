import { Request, Response, NextFunction } from "express";
import { SurveyExecutionService } from "../services/SurveyExecutionService";
import { AISurveyFlowService } from "../services/AISurveyFlowService";

export class SurveyExecutionController {
    constructor(
        private readonly executionService = new SurveyExecutionService(),
        private readonly aiFlowService = new AISurveyFlowService()
    ) {}

    startSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { surveyId, campaignId, leadId, respondentId, conversationId, metadata } = req.body;

            const targetSurveyId = String(surveyId || req.params.surveyId || req.params.id || "");
            if (!targetSurveyId) {
                return res.status(400).json({
                    success: false,
                    message: "surveyId is required to start a survey session",
                });
            }

            const result = await this.executionService.startSurvey({
                surveyId: targetSurveyId,
                campaignId: campaignId ? String(campaignId) : undefined,
                leadId: leadId ? String(leadId) : undefined,
                respondentId: respondentId ? String(respondentId) : undefined,
                conversationId: conversationId ? String(conversationId) : undefined,
                metadata,
            });

            return res.status(201).json({
                success: true,
                message: "Survey session started successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId is required",
                });
            }

            const session = await this.executionService.getSurveySession(sessionId);

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: `Survey session ${sessionId} not found`,
                });
            }

            return res.json({
                success: true,
                data: session,
            });
        } catch (error) {
            next(error);
        }
    };

    getCurrentQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId is required",
                });
            }

            const question = await this.executionService.getCurrentQuestion(sessionId);

            return res.json({
                success: true,
                data: question,
            });
        } catch (error) {
            next(error);
        }
    };

    extractAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { surveyId, questionId, rawAnswer } = req.body;
            const targetSurveyId = String(surveyId || req.params.surveyId || "");
            const targetQuestionId = String(questionId || req.params.questionId || "");

            if (!targetSurveyId || !targetQuestionId || rawAnswer === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "surveyId, questionId, and rawAnswer are required for answer extraction",
                });
            }

            const extracted = await this.executionService.extractAnswer(
                targetSurveyId,
                targetQuestionId,
                String(rawAnswer)
            );

            return res.json({
                success: true,
                data: extracted,
            });
        } catch (error) {
            next(error);
        }
    };

    processTurn = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            const { message, customerMessage, leadName, productName, channel } = req.body;
            const text = String(message || customerMessage || "");

            if (!sessionId || !text.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId and message/customerMessage are required",
                });
            }

            const result = await this.aiFlowService.processTurn({
                sessionId,
                customerMessage: text.trim(),
                conversationContext: {
                    leadName,
                    productName,
                    channel,
                },
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    submitNaturalLanguageAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            const { questionId, rawAnswer } = req.body;

            if (!sessionId || !questionId || rawAnswer === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId, questionId, and rawAnswer are required",
                });
            }

            const result = await this.executionService.submitNaturalLanguageAnswer(
                sessionId,
                String(questionId),
                String(rawAnswer)
            );

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || req.params.responseId || "");
            const { questionId, rawAnswer, normalizedAnswer, answerType, confidence, extractedBy } = req.body;

            if (!sessionId || !questionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId and questionId are required to submit an answer",
                });
            }

            const result = await this.executionService.submitAnswer(sessionId, {
                questionId: String(questionId),
                rawAnswer,
                normalizedAnswer,
                answerType,
                confidence,
                extractedBy,
            });

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    skipQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            const { questionId } = req.body;

            if (!sessionId || !questionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId and questionId are required to skip question",
                });
            }

            const result = await this.executionService.skipQuestion(sessionId, String(questionId));

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    completeSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId is required",
                });
            }

            const session = await this.executionService.completeSurvey(sessionId);

            return res.json({
                success: true,
                message: "Survey session completed",
                data: session,
            });
        } catch (error) {
            next(error);
        }
    };

    abandonSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = String(req.params.id || req.params.sessionId || "");
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId is required",
                });
            }

            const { reason } = req.body;
            const session = await this.executionService.abandonSurvey(sessionId, reason ? String(reason) : undefined);

            return res.json({
                success: true,
                message: "Survey session marked as abandoned",
                data: session,
            });
        } catch (error) {
            next(error);
        }
    };
}
