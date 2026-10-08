import mongoose, { Document, Model, Schema } from "mongoose";

export enum CampaignLeadStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    CONTACTED = "CONTACTED",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
}

export enum CampaignActionType {
    CALL = "CALL",
    SURVEY = "SURVEY",
    FOLLOW_UP = "FOLLOW_UP",
    AI_MESSAGE = "AI_MESSAGE",
    EMAIL = "EMAIL",
}

export interface ICampaignLead {
    campaignId: mongoose.Types.ObjectId;
    leadId: mongoose.Types.ObjectId;
    action: CampaignActionType | string;
    status: CampaignLeadStatus;
    conversationId?: mongoose.Types.ObjectId;
    surveySessionId?: mongoose.Types.ObjectId;
    followUpId?: mongoose.Types.ObjectId;
    retryCount: number;
    lastContactedAt?: Date;
    completedAt?: Date;
    error?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ICampaignLeadDocument = ICampaignLead & Document;

const CampaignLeadSchema = new Schema<ICampaignLeadDocument>(
    {
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },
        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: Object.values(CampaignActionType),
            default: CampaignActionType.SURVEY,
        },
        status: {
            type: String,
            enum: Object.values(CampaignLeadStatus),
            default: CampaignLeadStatus.PENDING,
            index: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
        },
        surveySessionId: {
            type: Schema.Types.ObjectId,
            ref: "SurveyResponse",
        },
        followUpId: {
            type: Schema.Types.ObjectId,
            ref: "FollowUp",
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        lastContactedAt: Date,
        completedAt: Date,
        error: String,
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate campaign execution per lead (idempotency)
CampaignLeadSchema.index(
    {
        campaignId: 1,
        leadId: 1,
    },
    {
        unique: true,
    }
);

export const CampaignLeadModel: Model<ICampaignLeadDocument> =
    (mongoose.models.CampaignLead as Model<ICampaignLeadDocument>) ||
    mongoose.model<ICampaignLeadDocument>("CampaignLead", CampaignLeadSchema);
