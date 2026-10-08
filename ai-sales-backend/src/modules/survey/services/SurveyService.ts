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
        const survey = await this.surveyRepository.findById(surveyId);
        if (!survey) return null;
        const questions = await this.questionRepository.findBySurveyId(surveyId);
        const obj = (survey as any).toObject ? (survey as any).toObject() : survey;
        return {
            ...obj,
            questions: questions || [],
        };
    }

    async getSurveyByCampaign(campaignId: string) {
        const survey = await this.surveyRepository.findByCampaignId(campaignId);
        if (!survey) return null;
        const questions = await this.questionRepository.findBySurveyId(survey._id.toString());
        const obj = (survey as any).toObject ? (survey as any).toObject() : survey;
        return {
            ...obj,
            questions: questions || [],
        };
    }

    async getAllSurveys(campaignId?: string) {
        if (campaignId) {
            return this.surveyRepository.findAllByCampaignId(campaignId);
        }
        return this.surveyRepository.findAll();
    }


    async getQuestions(surveyId: string) {
        return this.questionRepository.findBySurveyId(
            surveyId
        );
    }

    async saveQuestions(surveyId: string, questions: Partial<ISurveyQuestion>[]) {
        await this.questionRepository.deleteBySurveyId(surveyId);
        if (questions && questions.length > 0) {
            const prepared = questions.map((q, idx) => ({
                ...q,
                surveyId: new mongoose.Types.ObjectId(surveyId),
                order: idx + 1,
                questionId: q.questionId || `q_${idx + 1}`,
            }));
            await this.questionRepository.createMany(prepared as any);
        }
        return this.getSurvey(surveyId);
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
        createdBy?: string;
        questions?: Partial<ISurveyQuestion>[];
    }) {
        const cId = data.campaignId && mongoose.Types.ObjectId.isValid(data.campaignId)
            ? new mongoose.Types.ObjectId(data.campaignId)
            : new mongoose.Types.ObjectId();
        const uId = data.createdBy && mongoose.Types.ObjectId.isValid(data.createdBy)
            ? new mongoose.Types.ObjectId(data.createdBy)
            : new mongoose.Types.ObjectId();

        let survey = await this.surveyRepository.findByCampaignId(data.campaignId);
        if (!survey) {
            survey = await this.surveyRepository.create({
                campaignId: cId,
                name: data.name,
                description: data.description,
                language: data.language || "en-IN",
                welcomeMessage: data.welcomeMessage,
                endMessage: data.endMessage,
                createdBy: uId,
            });
        } else {
            survey = await this.surveyRepository.update(survey._id.toString(), {
                name: data.name,
                description: data.description,
                language: data.language || "en-IN",
                welcomeMessage: data.welcomeMessage,
                endMessage: data.endMessage,
            });
        }

        if (survey && data.questions && data.questions.length > 0) {
            await this.saveQuestions(survey._id.toString(), data.questions);
        }

        return this.getSurvey(survey!._id.toString());
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