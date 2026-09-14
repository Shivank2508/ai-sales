import { ConversationIntent, ConversationOutcome, ConversationSentiment, ObjectionType } from "./conversation-intelligence.types";

export interface ConversationAnalytics {
    totalConversations: number;
    intent: Record<ConversationIntent, number>;
    sentiment: Record<ConversationSentiment, number>;
    outcomes: Record<ConversationOutcome, number>;
    objections: Record<ObjectionType, number>;
    buyingSignals: {
        signal: string;
        count: number;
    }[];
    competitorMentions: {
        competitor: string;
        count: number;
    };
    purchaseRate: number;
    demoRequestRate: number;
    followUpRate: number;
}