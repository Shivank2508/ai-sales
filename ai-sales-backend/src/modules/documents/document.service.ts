import { Types } from "mongoose";
import fs from "node:fs/promises";

import { ProductRepository } from "../products/product.repository";
import { ChunkRepository } from "./chunk.repository";
import { DocumentRepository } from "./document.repository";

import { DocumentType } from "./document.types";
import { extractTextFromFile } from "./document.parser";
import { cleanDocumentText } from "./document.cleaner";
import { chunkText } from "./document.chunker";
import { VectorRepository } from "../../vector/vector.repository";
import { EmbeddingService } from "../../services/embedding.service";

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
        private readonly productRepository = new ProductRepository(),
        private readonly embeddingService = new EmbeddingService(),
        private readonly vectorRepository = new VectorRepository(),
    ) { }

    async uploadDocument(input: UploadDocumentInput) {
        const { productId, name, type, file } = input;

        if (!Types.ObjectId.isValid(productId)) {
            await this.safeDeleteFile(file.path);
            throw new Error("Invalid product ID");
        }

        const product = await this.productRepository.findById(productId);

        if (!product) {
            await this.safeDeleteFile(file.path);
            throw new Error("Product not found");
        }

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

        let savedChunks: Awaited<
            ReturnType<ChunkRepository["createMany"]>
        > = [];

        const namespace = `product-${productId}`;

        try {
            await this.documentRepository.updateStatus(
                document._id.toString(),
                "PROCESSING"
            );

            const extractedText = await extractTextFromFile(
                file.path,
                file.mimetype
            );

            const cleanedText = cleanDocumentText(extractedText);

            if (!cleanedText.trim()) {
                throw new Error(
                    "No text could be extracted from document"
                );
            }

            const chunks = chunkText(cleanedText);

            if (chunks.length === 0) {
                throw new Error(
                    "No chunks could be created from document"
                );
            }

            savedChunks = await this.chunkRepository.createMany(
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

            const embeddings =
                await this.embeddingService.embedDocuments(
                    savedChunks.map((chunk) => chunk.content)
                );

            if (
                !Array.isArray(embeddings) ||
                embeddings.length !== savedChunks.length ||
                embeddings.some(
                    (embedding) => !Array.isArray(embedding) || embedding.length === 0
                )
            ) {
                throw new Error(
                    "Embedding generation failed or returned an unexpected result"
                );
            }

            const vectors = savedChunks.map((chunk, index) => ({
                id: chunk._id.toString(),
                values: embeddings[index],
                metadata: {
                    productId,
                    documentId: document._id.toString(),
                    chunkId: chunk._id.toString(),
                    chunkIndex: chunk.chunkIndex,
                    type,
                    text: chunk.content,
                },
            }));

            if (vectors.length === 0) {
                throw new Error("No vectors were generated for document upload.");
            }

            await this.vectorRepository.upsert(
                namespace,
                vectors
            );

            return await this.documentRepository.updateStatus(
                document._id.toString(),
                "READY",
                {
                    chunkCount: savedChunks.length,
                }
            );
        } catch (error) {
            try {
                if (savedChunks.length > 0) {
                    await this.chunkRepository.deleteByDocumentId(
                        document._id.toString()
                    );

                    // If your repository supports it, clean up vectors too.
                    // await this.vectorRepository.delete(
                    //     namespace,
                    //     savedChunks.map(c => c._id.toString())
                    // );
                }

                await this.documentRepository.updateStatus(
                    document._id.toString(),
                    "FAILED"
                );
            } finally {
                await this.safeDeleteFile(file.path);
            }

            throw error instanceof Error
                ? error
                : new Error("Document processing failed");
        }
    }

    private async safeDeleteFile(
        filePath: string
    ): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch {
            // Ignore cleanup errors
        }
    }
}