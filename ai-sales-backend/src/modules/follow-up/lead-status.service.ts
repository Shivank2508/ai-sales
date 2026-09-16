import { ConversationIntelligenceRepository } from "../conversation-intelligence/conversation-intelligence.repository";
import { ConversationIntent, ConversationOutcome } from "../conversation-intelligence/conversation-intelligence.types";
import { LeadStatusDecision } from "./lead-status.types";

export class LeadStatusService {
    private readonly intelligenceRepository = new ConversationIntelligenceRepository();

    async determineStatus(conversationId: string): Promise<LeadStatusDecision> {
        const intelligence = await this.intelligenceRepository.findByConversationId(conversationId);

        if (!intelligence) {
            throw new Error(
                "Conversation intelligence not found"
            );
        }

        // 1. Outcome-based rules
        if (intelligence.outcome === ConversationOutcome.PURCHASE) {
            return {
                status: "WON",
                reason: "Customer completed the purchase.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === ConversationOutcome.LOST || intelligence.outcome === ConversationOutcome.NOT_INTERESTED) {
            return {
                status: "LOST",
                reason: "Conversation indicates that the customer is no longer interested.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === ConversationOutcome.DEMO_REQUESTED) {
            return {
                status: "QUALIFIED",
                reason: "Customer requested a product demonstration.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === ConversationOutcome.INTERESTED) {
            return {
                status: "QUALIFIED",
                reason: "Customer showed high interest during the conversation.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === ConversationOutcome.FOLLOW_UP_REQUIRED) {
            return {
                status: "QUALIFIED",
                reason: "Conversation requires sales follow-up with the customer.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        // 2. Intent and buying signals rules
        if (intelligence.intent === ConversationIntent.PURCHASE_INTENT) {
            return {
                status: "QUALIFIED",
                reason: "Conversation indicates strong purchase intent.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.intent === ConversationIntent.PRODUCT_INTEREST) {
            return {
                status: "QUALIFIED",
                reason: "Customer showed meaningful interest in the product.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (
            intelligence.intent === ConversationIntent.COMPETITOR ||
            (intelligence.competitorMentions && intelligence.competitorMentions.length > 0)
        ) {
            return {
                status: "QUALIFIED",
                reason: "Customer is actively evaluating solutions and competitors.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.buyingSignals && intelligence.buyingSignals.length > 0) {
            return {
                status: "QUALIFIED",
                reason: "Customer exhibited positive buying signals.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.intent === ConversationIntent.PRICING) {
            return {
                status: "CONTACTED",
                reason: "Customer engaged in a pricing discussion.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        // 3. Fallback for general conversation engagement
        return {
            status: "CONTACTED",
            reason: "Customer has engaged in a sales conversation.",
            confidence: intelligence.confidence,
            source: "CONVERSATION_INTELLIGENCE",
        };
    }
}