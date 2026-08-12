import { EmbeddingService } from "../../../services/embedding.service";
import { VectorRepository } from "../../../vector/vector.repository";
import { ChunkRepository } from "../../documents/chunk.repository";

import {
    Tool,
    ToolContext,
} from "./tool.interface";

export interface KnowledgeSearchResult {
    chunkId: string;
    documentId: string;
    content: string;
    score: number;
    chunkIndex: number;
}

export class SearchKnowledgeTool
    implements Tool {

    name = "SEARCH_KNOWLEDGE" as const;

    description =
        "Search the product knowledge base for FAQs, objections, competitors, case studies, sales playbooks, and product information.";

    parameters = {
        type: "object" as const,

        properties: {
            question: {
                type: "string",

                description:
                    "The knowledge-related question to search for.",
            },
        },

        required: [
            "question",
        ],

        additionalProperties: false,
    };

    constructor(
        private readonly embeddingService =
            new EmbeddingService(),

        private readonly vectorRepository =
            new VectorRepository(),

        private readonly chunkRepository =
            new ChunkRepository(),
    ) { }

    async execute(
        context: ToolContext,
        args: Record<string, unknown>
    ): Promise<KnowledgeSearchResult[]> {

        const question =
            typeof args.question === "string"
                ? args.question
                : context.question;

        if (!question.trim()) {
            throw new Error(
                "Question is required."
            );
        }

        const embedding =
            await this.embeddingService.embedText(
                question
            );

        const namespace =
            `product-${context.productId}`;

        const searchResult =
            await this.vectorRepository.search(
                namespace,
                embedding.embedding,
                5
            );

        if (
            !searchResult.matches ||
            searchResult.matches.length === 0
        ) {
            return [];
        }

        const chunkIds =
            searchResult.matches.map(
                match => match.id
            );

        const chunks =
            await this.chunkRepository.findByIds(
                chunkIds
            );

        const chunkMap =
            new Map(
                chunks.map(chunk => [
                    chunk._id.toString(),
                    chunk,
                ])
            );

        return searchResult.matches
            .map(match => {

                const chunk =
                    chunkMap.get(match.id);

                if (!chunk) {
                    return null;
                }

                return {
                    chunkId:
                        chunk._id.toString(),

                    documentId:
                        chunk.documentId.toString(),

                    content:
                        chunk.content,

                    score:
                        match.score ?? 0,

                    chunkIndex:
                        chunk.chunkIndex,
                };

            })
            .filter(
                (
                    result
                ): result is KnowledgeSearchResult =>
                    result !== null
            );
    }
}