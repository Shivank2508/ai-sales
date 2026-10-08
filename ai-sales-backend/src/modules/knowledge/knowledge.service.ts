import { Types } from "mongoose";



import { ProductRepository } from "../products/product.repository.js";
import { KnowledgeRepository } from "./knowledge.repository.js";

import type {
    CreateKnowledgeInput,
    UpdateKnowledgeInput,
} from "./knowledge.types.js";

export class KnowledgeService {
    constructor(
        private readonly knowledgeRepository =
            new KnowledgeRepository(),

        private readonly productRepository =
            new ProductRepository()
    ) { }

    async createKnowledge(
        input: CreateKnowledgeInput
    ) {
        if (input.productId) {
            this.validateId(input.productId, "product");
        }
        if (input.campaignId) {
            this.validateId(input.campaignId, "campaign");
        }

        return this.knowledgeRepository.create(input);
    }

    async getKnowledgeItems(
        productId?: string,
        campaignId?: string
    ) {
        if (campaignId && productId) {
            return this.knowledgeRepository.findFiltered({ campaignId, productId });
        }
        if (campaignId) {
            return this.knowledgeRepository.findByCampaignId(campaignId);
        }
        if (productId) {
            this.validateId(productId, "product");
            return this.knowledgeRepository.findByProductId(productId);
        }

        return this.knowledgeRepository.findAll();
    }

    async getKnowledge(id: string) {
        this.validateId(id, "knowledge");

        const item =
            await this.knowledgeRepository.findById(id);

        if (!item) {
            throw new Error(
                //  404,
                "Knowledge item not found",
                // ErrorCode.KNOWLEDGE_NOT_FOUND
            );
        }

        return item;
    }

    async updateKnowledge(
        id: string,
        input: UpdateKnowledgeInput
    ) {
        this.validateId(id, "knowledge");

        const item =
            await this.knowledgeRepository.updateById(
                id,
                input
            );

        if (!item) {
            throw new Error(
                // 404,
                "Knowledge item not found",
                //   ErrorCode.KNOWLEDGE_NOT_FOUND
            );
        }

        return item;
    }

    async deleteKnowledge(id: string) {
        this.validateId(id, "knowledge");

        const item =
            await this.knowledgeRepository.deleteById(id);

        if (!item) {
            throw new Error(
                //   404,
                "Knowledge item not found",
                // ErrorCode.KNOWLEDGE_NOT_FOUND
            );
        }
    }

    private validateId(
        id: string,
        resource: string
    ): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error(
                //  400,
                `Invalid ${resource} ID`,
                //    ErrorCode.VALIDATION_ERROR
            );
        }
    }
}