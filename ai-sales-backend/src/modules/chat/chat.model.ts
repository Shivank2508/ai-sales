import { model, Schema } from "mongoose";
import { CHAT_ROLES } from "./chat.types";

const MessageSchema = new Schema(
    {
        role: {
            type: String,
            enum: CHAT_ROLES,
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

const ConversationSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            index: true,
        },
        leadId: {
            type: Schema.Types.ObjectId,
            ref: "Lead",
            index: true,
        },
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            index: true,
        },
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
            index: true,
        },
        surveySessionId: {
            type: Schema.Types.ObjectId,
            ref: "SurveyResponse",
            index: true,
        },
        channel: {
            type: String,
            enum: ["CHAT", "VOICE"],
            default: "CHAT",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "COMPLETED", "ABANDONED"],
            default: "ACTIVE",
        },
        durationSeconds: {
            type: Number,
            default: 0,
        },
        title: {
            type: String,
            trim: true,
        },
        messages: {
            type: [MessageSchema],
            default: [],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

ConversationSchema.index({
    productId: 1,
    updatedAt: -1,
});

ConversationSchema.index({
    leadId: 1,
    createdAt: -1,
});

ConversationSchema.index({
    campaignId: 1,
    createdAt: -1,
});

export const ConversationModel = model(
    "Conversation",
    ConversationSchema
);