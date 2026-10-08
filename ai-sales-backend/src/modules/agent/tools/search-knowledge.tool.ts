import { EmbeddingService } from "../../../services/embedding.service";
import { VectorRepository } from "../../../vector/vector.repository";
import { ChunkRepository } from "../../documents/chunk.repository";
import { KnowledgeModel } from "../../knowledge/knowledge.model";
import { ChunkModel } from "../../documents/chunk.model";

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

        const queryWords = question.split(/\s+/).filter(w => w.length > 2);
        const regexFilters = queryWords.map(w => ({
            $or: [
                { content: { $regex: w, $options: "i" } },
                { title: { $regex: w, $options: "i" } }
            ]
        }));

        // -----------------------------------------
        // 1. Prioritize Campaign-Specific Knowledge First
        // -----------------------------------------
        if (context.campaignId) {
            try {
                const campaignItems = await KnowledgeModel.find({
                    $or: [
                        { campaignId: context.campaignId },
                        { campaignId: new KnowledgeModel.base.Types.ObjectId(context.campaignId) }
                    ]
                }).lean().exec();

                if (campaignItems && campaignItems.length > 0) {
                    const matching = campaignItems.filter(item => {
                        const text = `${item.title} ${item.content} ${(item.tags || []).join(" ")}`.toLowerCase();
                        return queryWords.length === 0 || queryWords.some(w => text.includes(w.toLowerCase()));
                    });
                    const itemsToReturn = matching.length > 0 ? matching : campaignItems;
                    return itemsToReturn.slice(0, 5).map((item: any) => ({
                        chunkId: item._id.toString(),
                        documentId: item._id.toString(),
                        documentName: `[Campaign Knowledge] ${item.title || item.type || "Document"}`,
                        documentType: item.type || "FAQ",
                        score: 0.98,
                        productId: (item.productId || context.productId || "").toString(),
                        content: `${item.title ? item.title + ": " : ""}${item.content}`,
                        chunkIndex: 0,
                    }));
                }
            } catch (err: any) {
                console.warn("[SearchKnowledgeTool] Campaign knowledge search error:", err.message);
            }
        }

        // -----------------------------------------
        // 2. Create embedding & search vector database
        // -----------------------------------------
        let searchResult: any = { matches: [] };
        try {
            const embedding =
                await this.embeddingService.embedText(
                    question
                );

            const namespace =
                `product-${context.productId}`;

            searchResult =
                await this.vectorRepository.search(
                    namespace,
                    embedding.embedding,
                    5
                );
        } catch (err: any) {
            console.warn("[SearchKnowledgeTool] Vector search warning:", err.message);
        }

        // -----------------------------------------
        // Fallback: If no vector matches, search general MongoDB KnowledgeModel & ChunkModel
        // -----------------------------------------
        if (
            !searchResult.matches ||
            searchResult.matches.length === 0
        ) {
            // Search general KnowledgeModel
            const fallbackItems = await KnowledgeModel.find(
                regexFilters.length > 0 ? { $or: regexFilters } : {}
            ).limit(5).lean().exec();

            if (fallbackItems && fallbackItems.length > 0) {
                return fallbackItems.map((item: any) => ({
                    chunkId: item._id.toString(),
                    documentId: item._id.toString(),
                    documentName: item.title || item.type || "Knowledge Document",
                    documentType: item.type || "FAQ",
                    score: 0.9,
                    productId: (item.productId || context.productId || "").toString(),
                    content: `${item.title ? item.title + ": " : ""}${item.content}`,
                    chunkIndex: 0,
                }));
            }


            // 3. Also check ChunkModel in MongoDB
            const chunkMatches = await ChunkModel.find(
                queryWords.length > 0 ? { $or: queryWords.map(w => ({ content: { $regex: w, $options: "i" } })) } : {}
            ).limit(5).lean().exec();

            if (chunkMatches && chunkMatches.length > 0) {
                return chunkMatches.map((chunk: any) => ({
                    chunkId: chunk._id.toString(),
                    documentId: chunk.documentId?.toString() || chunk._id.toString(),
                    documentName: chunk.metadata?.documentName || "Uploaded Document",
                    documentType: chunk.metadata?.documentType || "DOCUMENT",
                    score: 0.85,
                    productId: (chunk.productId || context.productId || "").toString(),
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex || 0,
                }));
            }

            return [];
        }


        // -----------------------------------------
        // 6. Get chunk IDs
        // -----------------------------------------

        const chunkIds =
            searchResult.matches.map(
                (match: any) => match.id
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
                chunks.map((chunk: any) => [
                    chunk._id.toString(),
                    chunk,
                ])
            );


        // -----------------------------------------
        // 9. Normalize search results
        // -----------------------------------------

        const results: KnowledgeSearchResult[] = [];

        for (const match of searchResult.matches) {
            const chunk: any = chunkMap.get(match.id);
            if (!chunk) continue;

            results.push({
                chunkId: chunk._id.toString(),
                documentId: chunk.documentId.toString(),
                documentName: chunk.metadata?.documentName ?? "Unknown document",
                documentType: chunk.metadata?.documentType,
                score: match.score ?? 0,
                productId: chunk.productId.toString(),
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
            });
        }

        return results;
    }
}