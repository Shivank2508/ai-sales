import { Types } from "mongoose";
import { ConversationIntelligenceRepository } from "../conversation-intelligence/conversation-intelligence.repository";
import { FollowUpRepository } from "./follow-up.repository";
import { CreateFollowUpInput, FollowUpPriority, FollowUpType } from "./follow-up.types";

export class FollowUpService {
    private readonly repository = new FollowUpRepository()
    private readonly intelligenceRepository = new ConversationIntelligenceRepository()

    async createFromConversation(conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new Error(
                "Invalid conversationId"
            );
        }

        const intelligence = await this.intelligenceRepository.findByConversationId(conversationId)
        if (!intelligence) {
            throw new Error("Conversation intelligence not found. Analyze the conversation first.");
        }

        if (intelligence.outcome === "NOT_INTERESTED" || intelligence.outcome === "LOST") {
            return null;
        }
        const input: CreateFollowUpInput = {
            conversationId,
            productId: intelligence.productId.toString(),
            task: intelligence.nextBestAction,
            type: this.determineType(intelligence.nextBestAction),
            priority: this.determinePriority(intelligence)
        }
        return this.repository.create(input);
    }

    async complete(followUpId: string) {
        if (!Types.ObjectId.isValid(followUpId)) {
            throw new Error("Invalid followUpId");
        }
        const followUp = await this.repository.findById(followUpId)

        if (!followUp) {
            throw new Error("Follow-up not found");
        }

        return this.repository.complete(followUpId)

    }
    async cancel(followUpId: string) {
        if (!Types.ObjectId.isValid(followUpId)) {
            throw new Error(
                "Invalid followUpId"
            );
        }

        const followUp = await this.repository.findById(followUpId)

        if (!followUp) {
            throw new Error("Follow-up not found")
        }

        return this.repository.cancel(followUpId)
    }
    async getPendingByProduct(productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new Error("Invalid productId")
        }

        return this.repository.findPendingByProduct(productId)
    }
    async determineType(action: string): FollowUpType {
        const text = action.toLowerCase()

        if (text.includes("demo")) {
            return FollowUpType.DEMO
        }

        if (text.includes("pricing") || text.includes("price")) {
            return FollowUpType.PRICING
        }
        if (text.includes("proposal")) {
            return FollowUpType.PROPOSAL;
        }
        if (text.includes("email")) {
            return FollowUpType.EMAIL;
        }
        if (text.includes("call")) {
            return FollowUpType.CALL;
        }

        return FollowUpType.GENERAL;
    }

    async determinePriority(intelligence: any): FollowUpPriority {
        if (intelligence.outcome === "DEMO_REQUESTED") {
            return FollowUpPriority.HIGH;
        }
        if (intelligence.outcome === "PURCHASE") {
            return FollowUpPriority.URGENT;
        }

        if (intelligence.outcome === "FOLLOW_UP_REQUIRED") {
            return FollowUpPriority.HIGH;
        }
        if (intelligence.outcome === "INTERESTED") {
            return FollowUpPriority.MEDIUM;
        }
        return FollowUpPriority.LOW;
    }
}