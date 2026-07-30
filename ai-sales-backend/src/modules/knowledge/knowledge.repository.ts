import { KnowledgeModel } from "./knowledge.model.js";

import type {
    CreateKnowledgeInput,
    UpdateKnowledgeInput,
} from "./knowledge.types.js";

export class KnowledgeRepository {
    async create(input: CreateKnowledgeInput) {
        const item =
            await KnowledgeModel.create(input);

        return item.toObject();
    }

    async findAll() {
        return KnowledgeModel
            .find()
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async findById(id: string) {
        return KnowledgeModel
            .findById(id)
            .lean()
            .exec();
    }

    async findByProductId(productId: string) {
        return KnowledgeModel
            .find({ productId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async updateById(
        id: string,
        input: UpdateKnowledgeInput
    ) {
        return KnowledgeModel
            .findByIdAndUpdate(
                id,
                input,
                {
                    new: true,
                    runValidators: true,
                }
            )
            .lean()
            .exec();
    }

    async deleteById(id: string) {
        return KnowledgeModel
            .findByIdAndDelete(id)
            .lean()
            .exec();
    }
}