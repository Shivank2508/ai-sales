import mongoose from "mongoose";
import { SurveyQuestionRepository } from "../repositories/SurveyQuestionRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { SurveyResponseRepository } from "../repositories/SurveyResponseRepository";
import { SurveyResponseStatus } from "../models/SurveyResponse.model";
import { ISurveyQuestion, QuestionAction } from "../models/SurveyQuestion.model";
import { SurveyFlowService } from "./SurveyFlowService";

export class SurveyService {
    private readonly surveyRepository = new SurveyRepository()
    private readonly questionRepository = new SurveyQuestionRepository()
    private readonly responseRepository = new SurveyResponseRepository()

    async getSurvey(surveyId: string) {
        return this.surveyRepository.findById(surveyId)
    }

    async getQuestions(surveyId: string) {
        return this.questionRepository.findBySurveyId(
            surveyId
        );
    }

    async startSurvey(params: {
        surveyId: string;
        campaignId: string;
        leadId?: string;
        conversationId?: string;
    }) {

        const firstQuestion =
            await this.questionRepository.findFirstQuestion(
                params.surveyId
            );

        if (!firstQuestion) {
            throw new Error(
                "Survey does not contain any questions"
            );
        }

        const response =
            await this.responseRepository.create({
                surveyId: new mongoose.Types.ObjectId(
                    params.surveyId
                ),

                campaignId: new mongoose.Types.ObjectId(
                    params.campaignId
                ),

                leadId: params.leadId
                    ? new mongoose.Types.ObjectId(params.leadId)
                    : undefined,

                conversationId: params.conversationId
                    ? new mongoose.Types.ObjectId(
                        params.conversationId
                    )
                    : undefined,

                status: SurveyResponseStatus.IN_PROGRESS,

                currentQuestionId:
                    firstQuestion.questionId,

                answers: [],

                completionPercentage: 0,

                startedAt: new Date(),
            });

        return {
            response,
            firstQuestion,
        };
    }

    async getCurrentQuestion(
        responseId: string
    ) {
        const response =
            await this.responseRepository.findById(
                responseId
            );

        if (!response) {
            throw new Error(
                "Survey response not found"
            );
        }

        if (!response.currentQuestionId) {
            return null;
        }

        return this.questionRepository
            .findByQuestionId(
                response.surveyId.toString(),
                response.currentQuestionId
            );
    }
    async createSurvey(data: {
        campaignId: string;
        name: string;
        description?: string;
        language?: string;
        welcomeMessage?: string;
        endMessage?: string;
        createdBy: string;
    }) {
        const existing = await this.surveyRepository.findByCampaignId(data.campaignId)
        if (existing) {
            throw new Error("Survey already exists for this campaign");
        }

        return this.surveyRepository.create({
            campaignId: new mongoose.Types.ObjectId(data.campaignId),
            name: data.name,
            description: data.description,
            language: data.language || "en-IN",
            welcomeMessage: data.welcomeMessage,
            endMessage: data.endMessage,
            createdBy: new mongoose.Types.ObjectId(data.createdBy),
        });
    }

    async updateSurvey(surveyId: string, data: Partial<{
        name: string;
        description: string;
        language: string;
        welcomeMessage: string;
        endMessage: string;
    }>) {
        const survey = await this.surveyRepository.update(surveyId, data)
        if (!survey) {
            throw new Error("Survey not found");
        }

        return survey
    }

    async addQuestion(surveyId: string, data: Partial<ISurveyQuestion>) {
        const survey = await this.surveyRepository.findById(surveyId)

        if (!survey) {
            throw new Error("Survey not found");
        }

        const questions = await this.questionRepository.findBySurveyId(surveyId);

        const order = questions.length + 1;

        return this.questionRepository.create({
            ...data,
            surveyId: new mongoose.Types.ObjectId(surveyId),
            order,
        });
    }
    async updateQuestion(
        questionId: string,
        data: Partial<ISurveyQuestion>
    ) {
        const question =
            await this.questionRepository.update(
                questionId,
                data
            );

        if (!question) {
            throw new Error("Question not found");
        }

        return question;
    }

    async deleteQuestion(
        questionId: string
    ) {
        const deleted =
            await this.questionRepository.delete(questionId);

        if (!deleted) {
            throw new Error("Question not found");
        }

        return {
            success: true,
        };
    }

    async answerQuestion(responseId: string, answer: {
        questionId: string;
        rawAnswer: string;
        normalizedAnswer: unknown;
        confidence?: number;
    }) {
        const response = await this.responseRepository.findById(responseId)

        if (!response) {
            throw new Error(
                "Survey response not found"
            );
        }

        const question = await this.questionRepository.findByQuestionId(response.surveyId.toString(), answer.questionId);
        if (!question) { throw new Error("Question not found"); }

        await this.responseRepository.addAnswer(
            responseId,
            {
                questionId: answer.questionId,
                rawAnswer: answer.rawAnswer,
                normalizedAnswer: answer.normalizedAnswer as any,
                confidence: answer.confidence,
                extractedBy: "ai",
                answeredAt: new Date(),
            }
        );

        const answers: Record<string, unknown> = {};

        for (const item of response.answers) {
            answers[item.questionId] =
                item.normalizedAnswer;
        }
        answers[answer.questionId] = answer.normalizedAnswer;
        const flowService = new SurveyFlowService();
        const flow = flowService.evaluateNextQuestion(question, answers);

        if (flow.action === QuestionAction.END_SURVEY) {
            return this.responseRepository.complete(
                responseId
            );
        }

        let nextQuestion: ISurveyQuestion | null = null;

        if (flow.nextQuestionId) {
            nextQuestion = await this.questionRepository.findByQuestionId(response.surveyId.toString(), flow.nextQuestionId);
        }

        if (!nextQuestion) {
            nextQuestion = await this.questionRepository.findNextByOrder(response.surveyId.toString(), question.order);
        }

        if (!nextQuestion) {
            return this.responseRepository.complete(
                responseId
            );
        }

        await this.responseRepository
            .updateCurrentQuestion(
                responseId,
                nextQuestion.questionId
            );

        return {
            completed: false,
            nextQuestion,
        };
    }
}