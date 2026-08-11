import { EmbeddingService } from "../../services/embedding.service";
import { VectorRepository } from "../../vector/vector.repository";
import { ChunkRepository } from "../documents/chunk.repository";

export interface RetrievedChunk {
    chunkId: string;
    score: number;
    content: string;
    metadata?: any;
}

export class RetrieverService {
    constructor(
        private readonly embeddingService =
            new EmbeddingService(),

        private readonly vectorRepository =
            new VectorRepository(),

        private readonly chunkRepository =
            new ChunkRepository()
    ) { }

    async retrieve(
        productId: string,
        question: string,
        topK = 5
    ): Promise<RetrievedChunk[]> {

        const embedding =
            await this.embeddingService.embedText(
                question
            );

        const namespace =
            `product-${productId}`;

        const result =
            await this.vectorRepository.search(
                namespace,
                embedding.embedding,
                topK
            );

        if (!result.matches?.length) {
            return [];
        }

        const ids =
            result.matches.map(
                (match) => match.id
            );

        const chunks =
            await this.chunkRepository.findByIds(
                ids
            );

        const map =
            new Map(
                chunks.map(chunk => [
                    chunk._id.toString(),
                    chunk,
                ])
            );

        return result.matches
            .map(match => {

                const chunk =
                    map.get(match.id);

                if (!chunk) {
                    return null;
                }

                return {
                    chunkId:
                        chunk._id.toString(),

                    score:
                        match.score ?? 0,

                    content:
                        chunk.content,

                    metadata:
                        chunk.metadata,
                };

            })
            .filter(Boolean) as RetrievedChunk[];
    }
}