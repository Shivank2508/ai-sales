import mongoose, { Document, Model, Schema } from "mongoose";

export enum SurveyResponseStatus {
<<<<<<< HEAD
    NOT_STARTED = "not_started",
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    STARTED = "started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
<<<<<<< HEAD
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
=======
}

export interface ISurveyAnswer {
    questionId: string;

    rawAnswer?: string;

    normalizedAnswer?: string | string[] | number;

    confidence?: number;

    extractedBy: "customer" | "ai";

    answeredAt: Date;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}

export interface ISurveyResponse {
    surveyId: mongoose.Types.ObjectId;
<<<<<<< HEAD
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
=======

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

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    createdAt?: Date;
    updatedAt?: Date;
}

<<<<<<< HEAD
export type ISurveySession = ISurveyResponse;
export type ISurveyResponseDocument = ISurveyResponse & Document;
export type ISurveySessionDocument = ISurveyResponseDocument;
=======
export type ISurveyResponseDocument = ISurveyResponse & Document;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

const SurveyAnswerSchema = new Schema<ISurveyAnswer>(
    {
        questionId: {
            type: String,
            required: true,
        },
<<<<<<< HEAD
        rawAnswer: String,
        normalizedAnswer: Schema.Types.Mixed,
        answerType: String,
=======

        rawAnswer: String,

        normalizedAnswer: Schema.Types.Mixed,

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        confidence: {
            type: Number,
            min: 0,
            max: 1,
        },
<<<<<<< HEAD
        extractedBy: {
            type: String,
            enum: ["customer", "ai"],
            default: "customer",
        },
=======

        extractedBy: {
            type: String,
            enum: ["customer", "ai"],
            required: true,
        },

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        answeredAt: {
            type: Date,
            default: Date.now,
        },
<<<<<<< HEAD
        skipped: {
            type: Boolean,
            default: false,
        },
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
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
=======

        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
            index: true,
        },
<<<<<<< HEAD
        respondentId: {
            type: String,
            index: true,
        },
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            index: true,
        },
<<<<<<< HEAD
        status: {
            type: String,
            enum: Object.values(SurveyResponseStatus),
            default: SurveyResponseStatus.IN_PROGRESS,
            index: true,
        },
        currentQuestionId: String,
=======

        status: {
            type: String,
            enum: Object.values(SurveyResponseStatus),
            default: SurveyResponseStatus.STARTED,
            index: true,
        },

        currentQuestionId: String,

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        answers: {
            type: [SurveyAnswerSchema],
            default: [],
        },
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        completionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        startedAt: {
            type: Date,
            default: Date.now,
        },
<<<<<<< HEAD
        completedAt: Date,
=======

        completedAt: Date,

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
    );

export const SurveySessionModel = SurveyResponseModel;
=======
    );
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
