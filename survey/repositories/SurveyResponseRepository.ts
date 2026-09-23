import mongoose from "mongoose";
import { ISurveyAnswer, ISurveyResponse, ISurveyResponseDocument, SurveyResponseModel, SurveyResponseStatus } from "../models/SurveyResponse.model";

export class SurveyResponseRepository {
    async create(data: Partial<ISurveyResponse>): Promise<ISurveyResponseDocument> {
        return SurveyResponseModel.create(data);
    }

    async findById(responseId: string): Promise<ISurveyResponse | null> {
        if (!mongoose.Types.ObjectId.isValid(responseId)) {
            return null;
        }

        return SurveyResponseModel
            .findById(responseId)
            .exec();
    }

    async findByConversationId(conversationId: string): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findOne({
            conversationId,
        }).exec();
    }

    async findByLeadId(leadId: string): Promise<ISurveyResponse[]> {
        return SurveyResponseModel
            .find({
                leadId,
            })
            .sort({
                createdAt: -1,
            })
            .exec();
    }

    async addAnswer(responseId: string, answer: ISurveyAnswer): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $push: {
                    answers: answer,
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async updateCurrentQuestion(responseId: string, questionId: string): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    currentQuestionId: questionId,
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async updateProgress(
        responseId: string,
        completionPercentage: number
    ): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    completionPercentage,
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async complete(
        responseId: string
    ): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    status: SurveyResponseStatus.COMPLETED,
                    completionPercentage: 100,
                    completedAt: new Date(),
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async abandon(
        responseId: string
    ): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    status: SurveyResponseStatus.ABANDONED,
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async countByStatus(
        surveyId: string,
        status: SurveyResponseStatus
    ): Promise<number> {
        return SurveyResponseModel.countDocuments({
            surveyId,
            status,
        }).exec();
    }

    async countCompleted(
        surveyId: string
    ): Promise<number> {
        return SurveyResponseModel.countDocuments({
            surveyId,
            status: SurveyResponseStatus.COMPLETED,
        }).exec();
    }
}