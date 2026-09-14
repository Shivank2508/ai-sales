export interface UpsertVectorInput {
    id: string;

    values: number[];

    metadata: {
        documentId: string;
        chunkId: string;
        productId?: string;

        text: string;

        chunkIndex: number;

        [key: string]: any;
    };
}

export interface SearchVectorInput {
    vector: number[];

    topK?: number;

    namespace: string;

    filter?: Record<string, any>;
}