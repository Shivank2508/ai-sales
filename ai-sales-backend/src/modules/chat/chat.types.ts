import { Types } from "mongoose";

export const CHAT_ROLES = [
    "SYSTEM",
    "USER",
    "ASSISTANT",
] as const;


export type chatRole = (typeof CHAT_ROLES)[number];
export interface CreateConversationInput {
    productId: Types.ObjectId | string;
    title?: string;
}
export interface ChatRequest {
    productId: string;
    conversationId?: string;
    message: string;
}

export interface ChatResponse {
    conversationId: string;
    answer: string;
}
export interface ChatMessage {
    role: chatRole;
    content: string;
    createdAt?: Date;
}
export interface AddMessageInput {
    conversationId: Types.ObjectId | string;
    role: chatRole;
    content: string
}

export interface ConversationDocument {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    title?: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}