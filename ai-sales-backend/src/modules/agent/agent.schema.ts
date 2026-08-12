import { z } from "zod";

export const agentChatSchema =
    z.object({

        productId:
            z.string()
                .min(
                    1,
                    "Product ID is required"
                ),

        question:
            z.string()
                .trim()
                .min(
                    1,
                    "Question is required"
                )
                .max(
                    5000,
                    "Question is too long"
                ),

        conversationId:
            z.string()
                .optional(),
    });