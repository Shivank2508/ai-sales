import { DocumentRepository } from "../../documents/document.repository";

import {
    Tool,
    ToolContext,
} from "./tool.interface";

export class ListDocumentsTool
    implements Tool {

    name = "LIST_DOCUMENTS" as const;

    description =
        "List documents uploaded for a product.";

    parameters = {
        type: "object" as const,

        properties: {},

        required: [],

        additionalProperties: false,
    };

    constructor(
        private readonly documentRepository =
            new DocumentRepository()
    ) { }

    async execute(
        context: ToolContext,
        _args: Record<string, unknown>
    ) {

        if (!context.productId) {
            throw new Error(
                "Product ID is required."
            );
        }

        const documents =
            await this.documentRepository
                .findByProductId(
                    context.productId
                );

        return documents.map(
            document => ({
                id:
                    document._id.toString(),

                name:
                    document.name,

                type:
                    document.type,

                originalName:
                    document.originalName,

                mimeType:
                    document.mimeType,

                fileSize:
                    document.fileSize,

                status:
                    document.status,

                chunkCount:
                    document.chunkCount,

                createdAt:
                    document.createdAt,

                updatedAt:
                    document.updatedAt,
            })
        );
    }
}