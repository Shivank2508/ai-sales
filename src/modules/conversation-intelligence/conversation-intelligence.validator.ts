import { ConversationAnalysis, ConversationIntent, ConversationOutcome, ObjectionType } from "./conversation-intelligence.types";

export function validateConversationAnalysis(value: unknown): ConversationAnalysis {
    if (!value || typeof value !== "object") {
        throw new Error("Conversation analysis must be an object");
    }

    const data = value as Record<string, unknown>

    if (typeof data.summary !== "string") {
        throw new Error("Invalid analysis summary")
    }

    if (!Object.values(ConversationIntent).includes(data.intent as ConversationIntent)) {
        throw new Error("Invalid conversation intent")
    }

    if (!Array.isArray(data.objections)) {
        throw new Error("Invalid objections");
    }
    for (const objection of data.objections) {
        if (!objection || typeof objection !== "object") {
            throw new Error("Invalid objection");
        }

        const item = objection as Record<string, unknown>

        if (!Object.values(ObjectionType).includes(item.type as ObjectionType)) {
            throw new Error("Invalid objection type")
        }
        if (typeof item.text !== "string") {
            throw new Error("Invalid objection text")
        }

        if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 1) {
            throw new Error("Invalid objection confidence")
        }
    }
    if (!Array.isArray(data.actionItems)) {
        throw new Error("Invalid action items")
    }

    if (!Object.values(ConversationOutcome).includes(data.outcome as ConversationOutcome)) {
        throw new Error("Invalid conversation outcome")
    }

    if (!Array.isArray(data.buyingSignals)) {
        throw new Error("Invalid buying signals")
    }

    if (!Array.isArray(data.competitorMentions)) {
        throw new Error("Invalid competitor mentions")
    }
    if (typeof data.nextBestAction !== "string") {
        throw new Error("Invalid next best action")
    }
    if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
        throw new Error("Invalid analysis confidence")
    }
    return value as ConversationAnalysis;
}