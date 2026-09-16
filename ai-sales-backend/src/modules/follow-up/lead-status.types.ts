import { ConversationIntent, ConversationOutcome, ConversationSentiment } from "../conversation-intelligence/conversation-intelligence.types";
import { LeadStatus } from "../leads/lead.types";

export interface LeadStatusDecision {
    status: LeadStatus;
    reason: string;
    confidence: number;
    source: "CONVERSATION_INTELLIGENCE";
}

export interface LeadStatusContext {
    intent: ConversationIntent;
    outcome: ConversationOutcome;
    sentiment: ConversationSentiment;
    buyingSignals: string[];
    confidence: number

}