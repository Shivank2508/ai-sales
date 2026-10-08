import mongoose, { Document, Model, Schema } from "mongoose";

export enum SurveyResponseStatus {
    NOT_STARTED = "not_started",
    STARTED = "started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
    FAILED = "failed",
}

export type SurveySessionStatus = SurveyResponseStatus;
export const SurveySessionStatus = SurveyResponseStatus;

export interface ISurveyAnswer {
    questionId: string;
    rawAnswer?: string;
    normalizedAnswer?: any;
    answerType?: string;
    confidence?: number;
    extractedBy: "customer" | "ai";
    answeredAt: Date;
    skipped?: boolean;
}

export interface ISurveyResponse {
    surveyId: mongoose.Types.ObjectId;
    surveyVersionId?: mongoose.Types.ObjectId;
    version?: number;
    campaignId?: mongoose.Types.ObjectId;
    leadId?: mongoose.Types.ObjectId;
    respondentId?: string;
    conversationId?: mongoose.Types.ObjectId;
    status: SurveyResponseStatus;
    currentQuestionId?: string;
    answers: ISurveyAnswer[];
    completionPercentage: number;
    startedAt: Date;
    completedAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ISurveySession = ISurveyResponse;
export type ISurveyResponseDocument = ISurveyResponse & Document;
export type ISurveySessionDocument = ISurveyResponseDocument;

const SurveyAnswerSchema = new Schema<ISurveyAnswer>(
    {
        questionId: {
            type: String,
            required: true,
        },
        rawAnswer: String,
        normalizedAnswer: Schema.Types.Mixed,
        answerType: String,
        confidence: {
            type: Number,
            min: 0,
            max: 1,
        },
        extractedBy: {
            type: String,
            enum: ["customer", "ai"],
            default: "customer",
        },
        answeredAt: {
            type: Date,
            default: Date.now,
        },
        skipped: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: false,
    }
);

const SurveyResponseSchema = new Schema<ISurveyResponseDocument>(
    {
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
            required: true,
            index: true,
        },
        surveyVersionId: {
            type: Schema.Types.ObjectId,
        },
        version: {
            type: Number,
            default: 1,
        },
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            index: true,
        },
        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
            index: true,
        },
        respondentId: {
            type: String,
            index: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(SurveyResponseStatus),
            default: SurveyResponseStatus.IN_PROGRESS,
            index: true,
        },
        currentQuestionId: String,
        answers: {
            type: [SurveyAnswerSchema],
            default: [],
        },
        completionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: Date,
        metadata: Schema.Types.Mixed,
    },
    {
        timestamps: true,
    }
);

export const SurveyResponseModel: Model<ISurveyResponseDocument> =
    (mongoose.models.SurveyResponse as Model<ISurveyResponseDocument>) ||
    mongoose.model<ISurveyResponseDocument>(
        "SurveyResponse",
        SurveyResponseSchema
    );

export const SurveySessionModel = SurveyResponseModel;