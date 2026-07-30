import {
    Schema,
    model,
    type InferSchemaType,
} from "mongoose";

import {
    KNOWLEDGE_TYPES,
} from "./knowledge.types.js";

const knowledgeSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        type: {
            type: String,
            enum: KNOWLEDGE_TYPES,
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export type Knowledge =
    InferSchemaType<typeof knowledgeSchema>;

export const KnowledgeModel =
    model("Knowledge", knowledgeSchema);