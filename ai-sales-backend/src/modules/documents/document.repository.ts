import { DocumentModel } from "./document.model";
import { CreateDocumentInput, DocumentStatus } from "./document.types";

export class DocumentRepository {
    async create(
        input: CreateDocumentInput
    ) {
        const document = await DocumentModel.create(input)
        return document.toObject()
    }

    async findById(id: string) {
        return DocumentModel
            .findById(id)
            .lean()
            .exec();
    }

    async findByProductId(
        productId: string
    ) {
        return DocumentModel
            .find({ productId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async updateStatus(
        id: string,
        status: DocumentStatus,
        data?: {
            chunkCount?: number;
            errorMessage?: string;
        }
    ) {
        return DocumentModel
            .findByIdAndUpdate(
                id,
                {
                    status,
                    ...data,
                },
                {
                    new: true,
                }
            )
            .lean()
            .exec();
    }

    async deleteById(id: string) {
        return DocumentModel
            .findByIdAndDelete(id)
            .lean()
            .exec();
    }
}