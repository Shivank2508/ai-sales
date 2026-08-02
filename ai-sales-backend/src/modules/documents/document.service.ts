import { Types } from "mongoose";
import fs from "node:fs/promises";

import { ProductRepository } from "../products/product.repository";
import { ChunkRepository } from "./chunk.repository";
import { DocumentRepository } from "./document.repository";

import { DocumentType } from "./document.types";
import { extractTextFromFile } from "./document.parser";
import { cleanDocumentText } from "./document.cleaner";
import { chunkText } from "./document.chunker";

interface UploadDocumentInput {
    productId: string;
    name: string;
    type: DocumentType;
    file: Express.Multer.File;
}

export class DocumentService {
    constructor(
        private readonly documentRepository = new DocumentRepository(),
        private readonly chunkRepository = new ChunkRepository(),
        private readonly productRepository = new ProductRepository()
    ) { }

    async uploadDocument(input: UploadDocumentInput) {
        const { productId, name, type, file } = input;

        // Validate ObjectId
        if (!Types.ObjectId.isValid(productId)) {
            await this.safeDeleteFile(file.path);
            throw new Error("Invalid product ID");
        }

        // Ensure product exists
        const product = await this.productRepository.findById(productId);

        if (!product) {
            await this.safeDeleteFile(file.path);
            throw new Error("Product not found");
        }

        // Create document record
      const document = await this.documentRepository.create({
    productId,
    name,
    type,
    originalName: file.originalname,
    storedName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
});
        try {
            await this.documentRepository.updateStatus(
                document._id.toString(),
                "PROCESSING"
            );

            // Extract text
            const extractedText = await extractTextFromFile(
                file.path,
                file.mimetype
            );

            // Clean text
            const cleanedText = cleanDocumentText(extractedText);

            if (!cleanedText.trim()) {
                throw new Error("No text could be extracted from document");
            }

            // Chunk text
            const chunks = chunkText(cleanedText);

            if (chunks.length === 0) {
                throw new Error("No chunks could be created from document");
            }

            // Save chunks
            await this.chunkRepository.createMany(
                chunks.map((chunk) => ({
                    documentId: document._id.toString(),
                    productId,
                    content: chunk.content,
                    chunkIndex: chunk.chunkIndex,
                    metadata: {
                        documentName: name,
                        documentType: type,
                    },
                }))
            );
            // Mark document ready
            return await this.documentRepository.updateStatus(
                document._id.toString(),
                "READY",
                {
                    chunkCount: chunks.length,
                }
            );
        } catch (error) {
            // Remove saved chunks
            await this.chunkRepository.deleteByDocumentId(
                document._id.toString()
            );

            // Mark document failed
            await this.documentRepository.updateStatus(
                document._id.toString(),
                "FAILED",
                {
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "Unknown processing error",
                }
            );

            // Delete uploaded file
            await this.safeDeleteFile(file.path);

            throw error;
        }
    }

    private async safeDeleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }
}