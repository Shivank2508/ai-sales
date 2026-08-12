import {
    Schema,
    model,
    type InferSchemaType,
} from "mongoose";

const chunkSchema = new Schema(
    {
        documentId: {
            type: Schema.Types.ObjectId,
            ref: "Document",
            required: true,
        },

        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        chunkIndex: {
            type: Number,
            required: true,
        },

        metadata: {
            documentName: {
                type: String,
            },

            documentType: {
                type: String,
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

chunkSchema.index({
    documentId: 1,
    chunkIndex: 1,
});

chunkSchema.index({
    productId: 1,
});

export type Chunk = InferSchemaType<typeof chunkSchema>;

export const ChunkModel = model<Chunk>(
    "Chunk",
    chunkSchema
);