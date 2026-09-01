import { Document, Schema, Types } from "mongoose";
import { ConversationIntent, ConversationOutcome, ConversationSentiment, ObjectionType } from "./conversation-intelligence.types";


interface ConversationObjectionDocument {
    type: ObjectionType;
    text: string;
    confidence: number
}

interface ConversationActionItemDocument {
    task: string;
    owner?: string;
    dueDate?: string;
    completed: boolean
}

export interface ConversationIntelligenceDocument extends Document {
    conversationId: Types.ObjectId;
    productId: Types.ObjectId;
    summary: string;
    intent: ConversationIntent;
    sentiment: ConversationSentiment;
    objections: ConversationObjectionDocument[];
    actionItems: ConversationActionItemDocument[];
    outcome: ConversationOutcome;
    buyingSignals: string[];
    competitorMentions: string[];
    nextBestAction: string;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
}

const objectionSchema = new Schema({
    type: {
        type: String,
        enum: Object.values(ObjectionType),
        required: true
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
    })


const actionItemSchema = new Schema({
    task: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        enum: ["SALES_REP", "CUSTOMER", "AI"]
    },
    dueDate: {
        type: String,
    },
    completed: {
        type: Boolean,
        default: false,
    }
}, {
    _id: false,
})


const conversationIntelligenceSchema = new Schema({
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
        enum: Object.values(ConversationIntent),
        required: true
    },
    sentiment: {
        type: String,
        enum: Object.values(ConversationSentiment),
        required: true
    },
    objections: {
        type: [objectionSchema,],
        default: [],
    },
    actionItems: {
        type: [actionItemSchema],
        default: [],
    },
    outcome: {
        type: String,
        enum: Object.values(ConversationOutcome),
        required: true
    },
    buyingSignals: {
        type: [String],
        default: []
    },
    competitorMentions: {
        type: [String],
        default: []
    }
})