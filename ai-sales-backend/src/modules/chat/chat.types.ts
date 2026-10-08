import { Types } from "mongoose";

export const CHAT_ROLES = [
    "SYSTEM",
    "USER",
    "ASSISTANT",
] as const;

export type chatRole = (typeof CHAT_ROLES)[number];

export interface CreateConversationInput {
    productId?: Types.ObjectId | string;
    title?: string;
    leadId?: Types.ObjectId | string;
    campaignId?: Types.ObjectId | string;
    surveyId?: Types.ObjectId | string;
    surveySessionId?: Types.ObjectId | string;
    channel?: "CHAT" | "VOICE" | string;
    status?: "ACTIVE" | "COMPLETED" | "ABANDONED" | string;
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
}

export interface ChatRequest {
    productId?: string;
    conversationId?: string;
    message: string;
    leadId?: string;
    campaignId?: string;
    surveyId?: string;
    surveySessionId?: string;
    channel?: "CHAT" | "VOICE";
}

export interface ChatResponse {
    conversationId: string;
    answer: string;
    surveySession?: any;
    currentSurveyQuestion?: any;
}

export interface ChatMessage {
    role: chatRole;
    content: string;
    createdAt?: Date;
}

export interface AddMessageInput {
    conversationId: Types.ObjectId | string;
    role: chatRole;
    content: string;
}

export interface ConversationDocument {
    _id: Types.ObjectId;
    productId?: Types.ObjectId;
    title?: string;
    leadId?: Types.ObjectId;
    campaignId?: Types.ObjectId;
    surveyId?: Types.ObjectId;
    surveySessionId?: Types.ObjectId;
    channel?: string;
    status?: string;
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateChatMessageInput {
    conversationId: string;
    productId?: string;
    role: chatRole;
    content: string;
    tool?: string;
    metadata?: {
        toolResult?: unknown;
    };
}