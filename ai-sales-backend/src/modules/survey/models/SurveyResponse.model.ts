import mongoose, { Document, Schema } from "mongoose";

export enum SurveyResponseStatus {
    STARTED = "started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
}

export interface ISurveyAnswer {
    questionId: string;

    rawAnswer?: string;

    normalizedAnswer?: string | string[] | number;

    confidence?: number;

    extractedBy: "customer" | "ai";

    answeredAt: Date;
}

export interface ISurveyResponse extends Document {
    surveyId: mongoose.Types.ObjectId;

    campaignId: mongoose.Types.ObjectId;

    leadId?: mongoose.Types.ObjectId;

    conversationId?: mongoose.Types.ObjectId;

    status: SurveyResponseStatus;

    currentQuestionId?: string;

    answers: ISurveyAnswer[];

    completionPercentage: number;

    startedAt: Date;

    completedAt?: Date;

    metadata?: Record<string, unknown>;

    createdAt: Date;
    updatedAt: Date;
}

const SurveyAnswerSchema = new Schema<ISurveyAnswer>(
    {
        questionId: {
            type: String,
            required: true,
        },

        rawAnswer: String,

        normalizedAnswer: Schema.Types.Mixed,

        confidence: {
            type: Number,
            min: 0,
            max: 1,
        },

        extractedBy: {
            type: String,
            enum: ["customer", "ai"],
            required: true,
        },

        answeredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

const SurveyResponseSchema = new Schema<ISurveyResponse>(
    {
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
            required: true,
            index: true,
        },

        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },

        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
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
            default: SurveyResponseStatus.STARTED,
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

export const SurveyResponseModel =
    mongoose.models.SurveyResponse ||
    mongoose.model<ISurveyResponse>(
        "SurveyResponse",
        SurveyResponseSchema
    );