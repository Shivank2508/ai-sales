import type {
    Request,
    Response,
} from "express";


import { DocumentService } from "./document.service.js";

import type {
    DocumentType,
} from "./document.types.js";

const documentService =
    new DocumentService();

export async function uploadDocument(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.file) {
        throw new Error(

            "Document file is required",

        );
    }

    const document =
        await documentService.uploadDocument({
            productId: req.body.productId,
            name: req.body.name,
            type: req.body.type as DocumentType,
            file: req.file,
        });

    res.send({
        statusCode: 201,
        message:
            "Document uploaded and processed successfully",
        data: document,
    });
}