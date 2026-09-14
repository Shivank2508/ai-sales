import { z } from "zod";

import {
    DOCUMENT_TYPES,
} from "./document.types.js";

export const uploadDocumentSchema =
    z.object({
        productId: z
            .string()
            .trim()
            .min(1),

        name: z
            .string()
            .trim()
            .min(1),

        type: z.enum(DOCUMENT_TYPES),
    });

export type UploadDocumentBody =
    z.infer<typeof uploadDocumentSchema>;