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

    async getAnalyticsByProduct(productId: string) {
        const objectId = new Types.ObjectId(productId);

        const [total, intent, sentiment, outcomes, objections, buyingSignals, competitorMentions] = await Promise.all([
            ConversationIntelligenceModel.countDocuments({ productId: objectId }),

            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $group: {
                        _id: "$intent",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),

            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $group: {
                        _id: "$sentiment",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $group: {
                        _id: "$outcome",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $unwind: "$objections",
                },
                {
                    $group: {
                        _id: "$objections.type",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $unwind: "$buyingSignals",
                },
                {
                    $group: {
                        _id: "$buyingSignals",
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        count: -1,
                    },
                },
                {
                    $limit: 10,
                },
            ]),
            ConversationIntelligenceModel.aggregate([
                {
                    $match: {
                        productId: objectId,
                    },
                },
                {
                    $unwind: "$competitorMentions",
                },
                {
                    $group: {
                        _id: "$competitorMentions",
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        count: -1,
                    },
                },
                {
                    $limit: 10,
                },
            ]),

        ])
        return {
            total,
            intent,
            sentiment,
            outcomes,
            objections,
            buyingSignals,
            competitorMentions,
        };
    }


}