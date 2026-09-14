import { EmbeddingService } from "../../../services/embedding.service";
import { VectorRepository } from "../../../vector/vector.repository";
import { ChunkRepository } from "../../documents/chunk.repository";

import {
    AgentSource,
} from "../agent.types";

import {
    Tool,
    ToolContext,
} from "./tool.interface";


export interface KnowledgeSearchResult extends AgentSource {
    productId: string;
    content: string;
    chunkIndex: number;
}


export class SearchKnowledgeTool implements Tool {

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

        // -----------------------------------------
        // 1. Get question
        // -----------------------------------------

        const question =
            typeof args.question === "string"
                ? args.question
                : context.question;


        if (!question.trim()) {
            throw new Error(
                "Question is required."
            );
        }


        // -----------------------------------------
        // 2. Create embedding
        // -----------------------------------------

        const embedding =
            await this.embeddingService.embedText(
                question
            );


        // -----------------------------------------
        // 3. Product namespace
        // -----------------------------------------

        const namespace =
            `product-${context.productId}`;


        // -----------------------------------------
        // 4. Search Pinecone
        // -----------------------------------------

        const searchResult =
            await this.vectorRepository.search(
                namespace,
                embedding.embedding,
                5
            );


        // -----------------------------------------
        // 5. Handle no results
        // -----------------------------------------

        if (
            !searchResult.matches ||
            searchResult.matches.length === 0
        ) {
            return [];
        }


        // -----------------------------------------
        // 6. Get chunk IDs
        // -----------------------------------------

        const chunkIds =
            searchResult.matches.map(
                match => match.id
            );


        // -----------------------------------------
        // 7. Get chunks from MongoDB
        // -----------------------------------------

        const chunks =
            await this.chunkRepository.findByIds(
                chunkIds
            );


        // -----------------------------------------
        // 8. Create lookup map
        // -----------------------------------------

        const chunkMap =
            new Map(
                chunks.map(chunk => [
                    chunk._id.toString(),
                    chunk,
                ])
            );


        // -----------------------------------------
        // 9. Normalize search results
        // -----------------------------------------

        return searchResult.matches

            .map(match => {

                const chunk =
                    chunkMap.get(match.id);


                // Pinecone result exists
                // but MongoDB chunk doesn't
                if (!chunk) {
                    return null;
                }


                return {

                    // Source information
                    chunkId:
                        chunk._id.toString(),

                    documentId:
                        chunk.documentId.toString(),

                    documentName:
                        chunk.metadata?.documentName ??
                        "Unknown document",

                    documentType:
                        chunk.metadata?.documentType,

                    score:
                        match.score ?? 0,


                    // Internal knowledge result
                    productId:
                        chunk.productId.toString(),

                    content:
                        chunk.content,

                    chunkIndex:
                        chunk.chunkIndex,
                };
            })


            // Remove missing chunks
            .filter(
                (
                    result
                ): result is KnowledgeSearchResult =>
                    result !== null
            );
    }
}