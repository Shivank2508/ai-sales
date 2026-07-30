import { ProductRepository } from "./product.repository";
import { CreateProductInput, UpdateProductInput } from "./product.types";

export class ProductService {
    constructor(
        private readonly productRespository = new ProductRepository()
    ) { }

    async createPreoduct(input: CreateProductInput) {
        return this.productRespository.create(input)
    }
    async getProducts() {
        return this.productRespository.findAll()
    }
    async getProduct(id: string) {
        // this.validateId(id);

        const product =
            await this.productRespository.findById(id);

        if (!product) {
            throw new Error(
                //404,
                "Product not found",
                //  ErrorCode.PRODUCT_NOT_FOUND
            );
        }

        return product;
    }

    async updateProduct(
        id: string,
        input: UpdateProductInput
    ) {
        // this.validateId(id);

        const product =
            await this.productRespository.updateById(
                id,
                input
            );

        if (!product) {
            throw new Error(
                // 404,
                "Product not found",
                //  ErrorCode.PRODUCT_NOT_FOUND
            );
        }

        return product;
    }

    async deleteProduct(id: string) {
        //this.validateId(id);

        const product =
            await this.productRespository.deleteById(id);

        if (!product) {
            throw new Error(
                // 404,
                "Product not found",
                //  ErrorCode.PRODUCT_NOT_FOUND
            );
        }
    }

}