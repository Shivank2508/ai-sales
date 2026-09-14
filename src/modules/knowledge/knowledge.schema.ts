import { z } from "zod";

import {
    KNOWLEDGE_TYPES,
} from "./knowledge.types.js";

export const createKnowledgeSchema = z.object({
    productId: z
        .string()
        .trim()
        .min(1),

    type: z.enum(KNOWLEDGE_TYPES),

    title: z
        .string()
        .trim()
        .min(1),

    content: z
        .string()
        .trim()
        .min(1),

    tags: z
        .array(
            z.string().trim().min(1)
        )
        .optional(),
});

export const updateKnowledgeSchema =
    createKnowledgeSchema
        .omit({
            productId: true,
        })
        .partial();