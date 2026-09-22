import mongoose from "mongoose";
import { SurveyQuestionRepository } from "../repositories/SurveyQuestionRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { SurveyResponseRepository } from "../repositories/SurveyResponseRepository";
import { SurveyResponseStatus } from "../models/SurveyResponse.model";

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
}