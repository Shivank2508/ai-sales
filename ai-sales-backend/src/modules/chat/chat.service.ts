import mongoose, { Types } from "mongoose";
import { ChatRepository } from "./chat.repository";
import { ChatRequest } from "./chat.types";
import { PromptBuilder } from "./prompt.builder";
import { RetrieverService } from "./retriever.service";
import { LLMService } from "../../services/llm.service";
import { ProductRepository } from "../products/product.repository";

export class ChatService {
    constructor(
        private readonly chatRepository = new ChatRepository(),
        private readonly retriever = new RetrieverService(),
        private readonly promptBuilder = new PromptBuilder(),
        private readonly productRepository = new ProductRepository()
    ) {}

    async chat(input: ChatRequest) {
        const { productId, conversationId, message, leadId, campaignId, surveyId, surveySessionId, channel = "CHAT" } = input;
        let conversation: any = null;

        if (conversationId && Types.ObjectId.isValid(conversationId)) {
            conversation = await this.chatRepository.findConversationById(conversationId);
        }

        let resolvedProductId = productId;
        if (!resolvedProductId && conversation?.productId) {
            resolvedProductId = conversation.productId.toString();
        }

        if (!resolvedProductId) {
            const allProducts = await this.productRepository.findAll();
            if (allProducts && allProducts.length > 0) {
                resolvedProductId = (allProducts[0] as any)._id.toString();
            }
        }

        if (!conversation) {
            conversation = await this.chatRepository.createConversation({
                productId: resolvedProductId ? new mongoose.Types.ObjectId(resolvedProductId) : undefined,
                leadId: leadId && mongoose.Types.ObjectId.isValid(leadId) ? new mongoose.Types.ObjectId(leadId) : undefined,
                campaignId: campaignId && mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : undefined,
                surveyId: surveyId && mongoose.Types.ObjectId.isValid(surveyId) ? new mongoose.Types.ObjectId(surveyId) : undefined,
                surveySessionId: surveySessionId && mongoose.Types.ObjectId.isValid(surveySessionId) ? new mongoose.Types.ObjectId(surveySessionId) : undefined,
                channel,
                status: "ACTIVE",
            });
        }

        const currentConvId = conversation._id.toString();

        await this.chatRepository.addMessage({
            conversationId: currentConvId,
            role: "USER",
            content: message,
        });

        if (!conversation.title) {
            await this.chatRepository.renameConversation(
                currentConvId,
                message.substring(0, 50)
            );
        }

        const history = await this.chatRepository.getRecentMessages(
            currentConvId,
            10
        );

        let context: any[] = [];
        if (resolvedProductId) {
            try {
                context = await this.retriever.retrieve(
                    resolvedProductId,
                    message,
                    5
                );
            } catch (err) {
                context = [];
            }
        }

        const prompt = this.promptBuilder.build({
            question: message,
            history,
            context,
        });

        const answer = await LLMService.generateText(
            prompt,
            message
        );

        await this.chatRepository.addMessage({
            conversationId: currentConvId,
            role: "ASSISTANT",
            content: answer,
        });

        return {
            conversationId: currentConvId,
            answer,
            sources: context,
        };
    }

    async getConversation(id: string) {
        return this.chatRepository.findConversationById(id);
    }

    async getProductConversations(productId: string) {
        return this.chatRepository.findProductConversations(productId);
    }

    async listConversations(filter: {
        leadId?: string;
        campaignId?: string;
        productId?: string;
        surveySessionId?: string;
    } = {}) {
        const query: Record<string, any> = {};
        if (filter.leadId && mongoose.Types.ObjectId.isValid(filter.leadId)) query.leadId = new mongoose.Types.ObjectId(filter.leadId);
        if (filter.campaignId && mongoose.Types.ObjectId.isValid(filter.campaignId)) query.campaignId = new mongoose.Types.ObjectId(filter.campaignId);
        if (filter.productId && mongoose.Types.ObjectId.isValid(filter.productId)) query.productId = new mongoose.Types.ObjectId(filter.productId);
        if (filter.surveySessionId && mongoose.Types.ObjectId.isValid(filter.surveySessionId)) query.surveySessionId = new mongoose.Types.ObjectId(filter.surveySessionId);

        return this.chatRepository.findAll(query);
    }

    async deleteConversation(id: string) {
        return this.chatRepository.deleteConversation(id);
    }
}