import { ConversationModel } from "./chat.model";
import { AddMessageInput, CreateConversationInput } from "./chat.types";

export class ChatRepository {
    async createConversation(input: CreateConversationInput) {
        const conversation = await ConversationModel.create(input)
        return conversation.toObject();
    }

    async findConversationById(
        id: string
    ) {
        return ConversationModel
            .findById(id)
            .lean()
            .exec();
    }

    async findProductConversations(
        productId: string
    ) {
        return ConversationModel
            .find({
                productId,
            })
            .sort({
                updatedAt: -1,
            })
            .lean()
            .exec();
    }

    async addMessage(
        input: AddMessageInput
    ) {
        return ConversationModel
            .findByIdAndUpdate(
                input.conversationId,
                {
                    $push: {
                        messages: {
                            role: input.role,

                            content:
                                input.content,

                            createdAt:
                                new Date(),
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

    async renameConversation(
        conversationId: string,
        title: string
    ) {
        return ConversationModel
            .findByIdAndUpdate(
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

    async deleteConversation(
        conversationId: string
    ) {
        return ConversationModel
            .findByIdAndDelete(
                conversationId
            )
            .lean()
            .exec();
    }

    async getRecentMessages(
        conversationId: string,
        limit = 10
    ) {
        const conversation =
            await ConversationModel
                .findById(conversationId)
                .lean()
                .exec();

        if (!conversation) {
            return [];
        }

        return conversation.messages.slice(-limit);
    }

}