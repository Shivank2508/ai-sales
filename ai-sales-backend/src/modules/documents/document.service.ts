import { Types } from "mongoose";
import { ProductRepository } from "../products/product.repository"
import { chunkRepository } from "./chunk.repository"
import { DocumentRepository } from "./document.repository"

interface UploadDocumentInput {
    productId: string;
    name: string;
    type: DocumentType;
    file: Express.Multer.File;
}


export class DocumentService {
    constructor(
        private readonly documentRepositary = new DocumentRepository(),
        private readonly ChunkRepository = new chunkRepository(),
        private readonly productRepository = new ProductRepository()
    ) { }
    async uploadDocument(
        input: UploadDocumentInput
    ) {
        const { productId, name, type, file } = input
        if (!Types.ObjectId.isValid(productId)) {
            await this.safeDeleteFile(file.path)
            throw new Error(
                "Invalid product ID",
            );
        }


    }

}