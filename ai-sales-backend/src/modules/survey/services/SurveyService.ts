import mongoose from "mongoose";
import { SurveyQuestionRepository } from "../repositories/SurveyQuestionRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { SurveyResponseRepository } from "../repositories/SurveyResponseRepository";
import { SurveyResponseStatus } from "../models/SurveyResponse.model";
import { ISurveyQuestion } from "../models/SurveyQuestion.model";

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
}