import { vectorIndex } from "../services/vector.pinecone";
import { UpsertVectorInput } from "./vector.types";

export class VectorRepository {
    async upsert(
        namespace: string,
        vectors: UpsertVectorInput[]
    ) {
        if (!Array.isArray(vectors) || vectors.length === 0) {
            console.warn(
                `VectorRepository.upsert called with ${vectors?.length ?? 0} vectors. Skipping Pinecone upsert.`
            );
            return;
        }

        return await vectorIndex
            .namespace(namespace)
            .upsert({
                records: vectors,
            } as any);
    }
    async search(
        namespace: string,
        vector: number[],
        topK = 5
    ) {
        return vectorIndex
            .namespace(namespace)
            .query({
                vector,
                topK,
                includeMetadata: true,
            });
    }
    async deleteVector(
        namespace: string,
        id: string
    ) {
        await vectorIndex
            .namespace(namespace)
            .deleteOne(id);
    }

    async deleteVectors(
        namespace: string,
        ids: string[]
    ) {
        await vectorIndex
            .namespace(namespace)
            .deleteMany(ids);
    }

    async deleteNamespace(
        namespace: string
    ) {
        await vectorIndex
            .namespace(namespace)
            .deleteAll();
    }

    async fetch(
        namespace: string,
        ids: string[]
    ) {
        return vectorIndex
            .namespace(namespace)
            .fetch(ids);
    }
}