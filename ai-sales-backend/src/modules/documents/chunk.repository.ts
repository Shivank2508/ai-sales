import { ChunkModel } from "./chunk.model";

interface CreateChunkType {
    documentId: string,
    productId: string,
    content: string;
    chunkIndex: number;

    metadata?: {
        documentName?: string;
        documentType?: string;
    };
}

export class chunkRepository {
    async createMany(chunks: CreateChunkType) {
        return ChunkModel.insertMany(chunks)
    }

    async findByDocumentId(
        documentId: string
    ) {
        return ChunkModel
            .find({ documentId })
            .sort({ chunkIndex: 1 })
            .lean()
            .exec();
    }

    async deleteByDocumentId(
        documentId: string
    ) {
        return ChunkModel.deleteMany({
            documentId,
        }).exec();
    }
}