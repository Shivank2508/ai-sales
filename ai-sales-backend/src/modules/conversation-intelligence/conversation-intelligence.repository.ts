import { Types } from "mongoose";
import { ConversationIntelligenceDocument, ConversationIntelligenceModel } from "./conversation-intelligence.model";

export class ConversationIntelligenceRepository {
    async create(data: Partial<ConversationIntelligenceDocument>) {
        return ConversationIntelligenceModel.create(data)
    }

    async findByConversationId(conversationId: string) {
        if (!Types.ObjectId.isValid(conversationId)) {
            return null
        }

        return ConversationIntelligenceModel.findOne({
            conversationId: new Types.ObjectId(conversationId)
        }).lean()
    }

    async updateByConversationId(conversationId: string, data: Partial<ConversationIntelligenceDocument>) {
        if (!Types.ObjectId.isValid(conversationId)) {
            return null
        }

        return ConversationIntelligenceModel.findOneAndUpdate(
            {
                conversationId: new Types.ObjectId(conversationId)
            },
            {
                $set: data
            },
            {
                new: true,
                upsert: true
            })
            .lean()
    }


}