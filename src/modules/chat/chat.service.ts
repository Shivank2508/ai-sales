import { Types } from "mongoose";
import { ChatRepository } from "./chat.repository";
import { ChatRequest } from "./chat.types";
import { PromptBuilder } from "./prompt.builder";
import { RetrieverService } from "./retriever.service";
import { deepseek } from "../../services/ai.openai";

export class ChatService {
    constructor(
        private readonly chatRepository =
            new ChatRepository(),
        private readonly retriever =
            new RetrieverService(),
        private readonly promptBuilder =
            new PromptBuilder()
    ) { }

    async chat(input: ChatRequest) {
        const { productId, conversationId, message, } = input;
        let conversation;

        if (conversationId && Types.ObjectId.isValid(conversationId)) {
            conversation = await this.chatRepository.findConversationById(
                conversationId
            );
        }

        if (!conversation) {
            conversation = await this.chatRepository.createConversation({
                productId,
            });
        }

        await this.chatRepository.addMessage({
            conversationId:
                conversation._id.toString(),
            role: "USER",
            content: message,
        });

        if (!conversation.title) {
            await this.chatRepository.renameConversation(
                conversation._id.toString(),
                message.substring(0, 50)
            );
        }

        const history =
            await this.chatRepository.getRecentMessages(
                conversation._id.toString(),
                10
            );
        const context = await this.retriever.retrieve(
            productId,
            message,
            5
        );

        const prompt =
            this.promptBuilder.build({
                question: message,
                history,
                context,
            });

        const completion =
            await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [

                    {
                        role: "system",
                        content: prompt,
                    },

                ],
                temperature: 0.2,

            });

        const answer =
            completion.choices[0]
                ?.message
                ?.content
                ?.trim()
            ?? "";

        await this.chatRepository.addMessage({
            conversationId:
                conversation._id.toString(),
            role: "ASSISTANT",
            content: answer,

        });
        return {

            conversationId:
                conversation._id.toString(),

            answer,

            sources: context,

        };

    }

    async getConversation(
        id: string
    ) {
        return this.chatRepository
            .findConversationById(id);
    }

    async getProductConversations(
        productId: string
    ) {
        return this.chatRepository
            .findProductConversations(
                productId
            );
    }

    async deleteConversation(
        id: string
    ) {
        return this.chatRepository
            .deleteConversation(id);
    }
}