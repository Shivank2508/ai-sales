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
<<<<<<< HEAD
    }[];
=======
    };
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    purchaseRate: number;
    demoRequestRate: number;
    followUpRate: number;
}