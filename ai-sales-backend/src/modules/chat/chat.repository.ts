import mongoose from "mongoose";
import { ConversationModel } from "./chat.model";
import { AddMessageInput, CreateConversationInput } from "./chat.types";

export class ChatRepository {
    async createConversation(input: CreateConversationInput) {
        const conversation: any = await ConversationModel.create(input as any);
        return conversation.toObject ? conversation.toObject() : conversation;
    }

    async findConversationById(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        return ConversationModel.findById(id).lean().exec();
    }

    async findProductConversations(productId: string) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return [];
        }
        return ConversationModel.find({
            productId,
        })
            .sort({
                updatedAt: -1,
            })
            .lean()
            .exec();
    }

    async findByLeadId(leadId: string) {
        if (!mongoose.Types.ObjectId.isValid(leadId)) {
            return [];
        }
        return ConversationModel.find({
            leadId,
        })
            .sort({
                createdAt: -1,
            })
            .lean()
            .exec();
    }

    async findByCampaignId(campaignId: string) {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return [];
        }
        return ConversationModel.find({
            campaignId,
        })
            .sort({
                createdAt: -1,
            })
            .lean()
            .exec();
    }

    async findBySurveySessionId(surveySessionId: string) {
        if (!mongoose.Types.ObjectId.isValid(surveySessionId)) {
            return null;
        }
        return ConversationModel.findOne({
            surveySessionId,
        })
            .lean()
            .exec();
    }

    async findAll(filter: Record<string, any> = {}, limit = 50) {
        return ConversationModel.find(filter)
            .sort({
                updatedAt: -1,
            })
            .limit(limit)
            .lean()
            .exec();
    }

    async updateConversationLinks(
        conversationId: string,
        links: {
            leadId?: string;
            campaignId?: string;
            surveyId?: string;
            surveySessionId?: string;
            status?: string;
            durationSeconds?: number;
        }
    ) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return null;
        }
        const updateData: Record<string, any> = {};
        if (links.leadId && mongoose.Types.ObjectId.isValid(links.leadId)) updateData.leadId = new mongoose.Types.ObjectId(links.leadId);
        if (links.campaignId && mongoose.Types.ObjectId.isValid(links.campaignId)) updateData.campaignId = new mongoose.Types.ObjectId(links.campaignId);
        if (links.surveyId && mongoose.Types.ObjectId.isValid(links.surveyId)) updateData.surveyId = new mongoose.Types.ObjectId(links.surveyId);
        if (links.surveySessionId && mongoose.Types.ObjectId.isValid(links.surveySessionId)) updateData.surveySessionId = new mongoose.Types.ObjectId(links.surveySessionId);
        if (links.status) updateData.status = links.status;
        if (links.durationSeconds !== undefined) updateData.durationSeconds = links.durationSeconds;

        return ConversationModel.findByIdAndUpdate(
            conversationId,
            { $set: updateData },
            { new: true }
        )
            .lean()
            .exec();
    }

    async addMessage(input: AddMessageInput) {
        if (!mongoose.Types.ObjectId.isValid(input.conversationId.toString())) {
            return null;
        }
        return ConversationModel.findByIdAndUpdate(
            input.conversationId,
            {
                $push: {
                    messages: {
                        role: input.role,
                        content: input.content,
                        createdAt: new Date(),
                    },
                },
            },
            {
                new: true,
            }
        )
            .lean()
            .exec();
    }

    async renameConversation(conversationId: string, title: string) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return null;
        }
        return ConversationModel.findByIdAndUpdate(
            conversationId,
            {
                title,
            },
            {
                new: true,
            }
        )
            .lean()
            .exec();
    }

    async deleteConversation(conversationId: string) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return null;
        }
        return ConversationModel.findByIdAndDelete(conversationId)
            .lean()
            .exec();
    }

    async getRecentMessages(conversationId: string, limit = 10) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return [];
        }
        const conversation = await ConversationModel.findById(conversationId)
            .lean()
            .exec();

        if (!conversation) {
            return [];
        }

        return conversation.messages.slice(-limit);
    }
}