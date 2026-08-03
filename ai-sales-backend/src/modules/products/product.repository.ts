import { ProductModel } from "./product.model";
import { CreateProductInput, UpdateProductInput } from "./product.types";

export class ProductRepository {
    async create(input: CreateProductInput) {
        const product = await ProductModel.create(input);
        return product.toObject()
    }
    async findAll() {
        return ProductModel
            .find()
            .sort({ createdAt: -1 })
            .lean()
            .exec()
    }

    async findById(id: string) {
        return ProductModel
            .findById(id)
            .lean()
            .exec()
    }
    async updateById(
        id: string,
        input: UpdateProductInput
    ) {
        return ProductModel
            .findByIdAndUpdate(
                id,
                input,
                {
                    returnDocument: "after",
                    runValidators: true,
                }
            )
            .lean()
            .exec();
    }

    async deleteById(id: string) {
        return ProductModel
            .findByIdAndDelete(id)
            .lean()
            .exec();
    }
}