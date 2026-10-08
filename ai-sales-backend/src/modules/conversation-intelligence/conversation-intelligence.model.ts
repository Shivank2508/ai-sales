import { Document, model, Schema, Types } from "mongoose";
import {
    ConversationActionItem,
    ConversationIntent,
    ConversationObjection,
    ConversationOutcome,
    ConversationSentiment,
    ObjectionType,
} from "./conversation-intelligence.types";

export interface ConversationIntelligenceDocument extends Document {
    conversationId: Types.ObjectId;
    productId: Types.ObjectId;
    summary: string;
    intent: ConversationIntent | string;
    sentiment: ConversationSentiment | string;
    sentimentScore?: number;
    topics: string[];
    painPoints: string[];
    objections: ConversationObjection[];
    actionItems: ConversationActionItem[];
    outcome: ConversationOutcome | string;
    buyingSignals: string[];
    competitorMentions: string[];
    customerNeeds: string[];
    productInterest: string[];
    nextBestAction: string;
    recommendedAction?: string;
    leadScore?: number;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
}

const objectionSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
    },
    {
        _id: false,
    }
);

const actionItemSchema = new Schema(
    {
        task: {
            type: String,
            required: true,
        },
        owner: {
            type: String,
            enum: ["SALES_REP", "CUSTOMER", "AI"],
            default: "SALES_REP",
        },
        dueDate: {
            type: String,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: false,
    }
);

const conversationIntelligenceSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            unique: true,
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        summary: {
            type: String,
            required: true,
        },
        intent: {
            type: String,
            required: true,
        },
        sentiment: {
            type: String,
            required: true,
        },
        sentimentScore: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5,
        },
        topics: {
            type: [String],
            default: [],
        },
        painPoints: {
            type: [String],
            default: [],
        },
        objections: {
            type: [objectionSchema],
            default: [],
        },
        actionItems: {
            type: [actionItemSchema],
            default: [],
        },
        outcome: {
            type: String,
            required: true,
        },
        buyingSignals: {
            type: [String],
            default: [],
        },
        competitorMentions: {
            type: [String],
            default: [],
        },
        customerNeeds: {
            type: [String],
            default: [],
        },
        productInterest: {
            type: [String],
            default: [],
        },
        nextBestAction: {
            type: String,
            required: true,
        },
        recommendedAction: {
            type: String,
        },
        leadScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            default: 0.9,
        },
    },
    {
        timestamps: true,
    }
);

export const ConversationIntelligenceModel = model<ConversationIntelligenceDocument>(
    "ConversationIntelligence",
    conversationIntelligenceSchema
);