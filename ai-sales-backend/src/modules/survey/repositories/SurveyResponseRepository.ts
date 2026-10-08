import mongoose from "mongoose";
<<<<<<< HEAD
import {
    ISurveyAnswer,
    ISurveyResponse,
    ISurveyResponseDocument,
    SurveyResponseModel,
    SurveyResponseStatus,
} from "../models/SurveyResponse.model";
=======
import { ISurveyAnswer, ISurveyResponse, ISurveyResponseDocument, SurveyResponseModel, SurveyResponseStatus } from "../models/SurveyResponse.model";
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

export class SurveyResponseRepository {
    async create(data: Partial<ISurveyResponse>): Promise<ISurveyResponseDocument> {
        return SurveyResponseModel.create(data);
    }

<<<<<<< HEAD
    async findById(responseId: string): Promise<ISurveyResponseDocument | null> {
=======
    async findById(responseId: string): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        if (!mongoose.Types.ObjectId.isValid(responseId)) {
            return null;
        }

<<<<<<< HEAD
        return SurveyResponseModel.findById(responseId).exec();
    }

    async findByConversationId(conversationId: string): Promise<ISurveyResponseDocument | null> {
=======
        return SurveyResponseModel
            .findById(responseId)
            .exec();
    }

    async findByConversationId(conversationId: string): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        return SurveyResponseModel.findOne({
            conversationId,
        }).exec();
    }

<<<<<<< HEAD
    async findByLeadId(leadId: string): Promise<ISurveyResponseDocument[]> {
        return SurveyResponseModel.find({
            leadId,
        })
=======
    async findByLeadId(leadId: string): Promise<ISurveyResponse[]> {
        return SurveyResponseModel
            .find({
                leadId,
            })
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            .sort({
                createdAt: -1,
            })
            .exec();
    }

<<<<<<< HEAD
    async findByLeadAndSurvey(surveyId: string, leadId: string): Promise<ISurveyResponseDocument | null> {
        return SurveyResponseModel.findOne({
            surveyId,
            leadId,
        })
            .sort({
                createdAt: -1,
            })
            .exec();
    }

    async findByRespondentId(surveyId: string, respondentId: string): Promise<ISurveyResponseDocument | null> {
        return SurveyResponseModel.findOne({
            surveyId,
            respondentId,
        })
            .sort({
                createdAt: -1,
            })
            .exec();
    }

    async findByCampaignId(campaignId: string): Promise<ISurveyResponseDocument[]> {
        return SurveyResponseModel.find({
            campaignId,
        })
            .sort({
                createdAt: -1,
            })
            .exec();
    }

    async findBySurveyId(surveyId: string): Promise<ISurveyResponseDocument[]> {
        return SurveyResponseModel.find({
            surveyId,
        })
            .sort({
                createdAt: -1,
            })
            .exec();
    }

    async addAnswer(responseId: string, answer: ISurveyAnswer): Promise<ISurveyResponseDocument | null> {
        // Filter out existing answer for the same questionId if any, then push new answer
        const session = await this.findById(responseId);
        if (!session) return null;

        const updatedAnswers = session.answers.filter((a) => a.questionId !== answer.questionId);
        updatedAnswers.push(answer);

        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    answers: updatedAnswers,
                    updatedAt: new Date(),
=======
    async addAnswer(responseId: string, answer: ISurveyAnswer): Promise<ISurveyResponse | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $push: {
                    answers: answer,
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                },
            },
            {
                new: true,
            }
        ).exec();
    }

<<<<<<< HEAD
    async updateCurrentQuestion(responseId: string, questionId: string): Promise<ISurveyResponseDocument | null> {
=======
    async updateCurrentQuestion(responseId: string, questionId: string): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    currentQuestionId: questionId,
<<<<<<< HEAD
                    status: SurveyResponseStatus.IN_PROGRESS,
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
    ): Promise<ISurveyResponseDocument | null> {
=======
    ): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
<<<<<<< HEAD
                    completionPercentage: Math.min(100, Math.max(0, Math.round(completionPercentage))),
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async updateStatus(
        responseId: string,
        status: SurveyResponseStatus
    ): Promise<ISurveyResponseDocument | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    status,
=======
                    completionPercentage,
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async complete(
        responseId: string
<<<<<<< HEAD
    ): Promise<ISurveyResponseDocument | null> {
=======
    ): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
        responseId: string,
        metadata?: Record<string, unknown>
    ): Promise<ISurveyResponseDocument | null> {
=======
        responseId: string
    ): Promise<ISurveyResponse | null> {
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    status: SurveyResponseStatus.ABANDONED,
<<<<<<< HEAD
                    ...(metadata ? { metadata } : {}),
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async fail(
        responseId: string,
        error?: string
    ): Promise<ISurveyResponseDocument | null> {
        return SurveyResponseModel.findByIdAndUpdate(
            responseId,
            {
                $set: {
                    status: SurveyResponseStatus.FAILED,
                    ...(error ? { "metadata.failureError": error } : {}),
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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