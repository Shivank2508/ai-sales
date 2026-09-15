import { ConversationIntelligenceRepository } from "../conversation-intelligence/conversation-intelligence.repository";
import { LeadStatusDecision } from "./lead-status.types";

export class LeadStatusService {
    private readonly intelligenceRepository = new ConversationIntelligenceRepository();

    async determineStatus(conversationId: string): Promise<LeadStatusDecision> {
        const intelligence = await this.intelligenceRepository.findByConversationId(conversationId)

        if (!intelligence) {
            throw new Error(
                "Conversation intelligence not found"
            );
        }

        if (intelligence.outcome === "PURCHASE") {
            return {
                status: "WON",
                reason: "Customer completed the purchase.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === "LOST" || intelligence.outcome === "NOT_INTERESTED") {
            return {
                status: "LOST",
                reason: "Conversation indicates that the customer is no longer interested.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }

        if (intelligence.outcome === "DEMO_REQUESTED") {
            return {
                status: "QUALIFIED",
                reason: "Customer requested a product demonstration.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }
        if (intelligence.intent === "PURCHASE_INTENT") {

            return {
                status: "HOT",
                reason: "Conversation indicates strong purchase intent.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }
        if (intelligence.intent === "PRODUCT_INTEREST") {
            return {
                status: "QUALIFIED",
                reason: "Customer showed meaningful interest in the product.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }
        if (intelligence.intent === "PRICING") {
            return {
                status: "CONTACTED",
                reason: "Customer engaged in a pricing discussion.",
                confidence: intelligence.confidence,
                source: "CONVERSATION_INTELLIGENCE",
            };
        }
        return {
            status: "CONTACTED",
            reason: "Customer has engaged in a sales conversation.",
            confidence: intelligence.confidence,
            source: "CONVERSATION_INTELLIGENCE",
        };
    }
}