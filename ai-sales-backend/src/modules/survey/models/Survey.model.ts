import mongoose, { Document, Model, Schema } from "mongoose";

export enum SurveyStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived",
}

export interface ISurvey {
    campaignId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    version: number;
    status: SurveyStatus;
    language: string;
    welcomeMessage?: string;
    endMessage?: string;
    maxQuestions?: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ISurveyDocument = ISurvey & Document;

const SurveySchema = new Schema<ISurveyDocument>(
    {
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        version: {
            type: Number,
            default: 1,
        },

        status: {
            type: String,
            enum: Object.values(SurveyStatus),
            default: SurveyStatus.DRAFT,
        },

        language: {
            type: String,
            default: "en-IN",
        },

        welcomeMessage: String,

        endMessage: String,

        maxQuestions: Number,

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const SurveyModel: Model<ISurveyDocument> =
    (mongoose.models.Survey as Model<ISurveyDocument>) ||
    mongoose.model<ISurveyDocument>("Survey", SurveySchema);