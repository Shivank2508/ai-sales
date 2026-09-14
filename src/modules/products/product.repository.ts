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

    async search(
        searchTerm: string
    ) {
        const regex =
            new RegExp(
                searchTerm.trim(),
                "i"
            );

        return ProductModel
            .find({
                $or: [
                    {
                        name: regex,
                    },
                    {
                        description: regex,
                    },
                    {
                        category: regex,
                    },
                ],
            })
            .limit(10)
            .lean()
            .exec();
    }


    async findByNames(
        names: string[]
    ) {
        if (
            !Array.isArray(names) ||
            names.length === 0
        ) {
            return [];
        }

        const normalizedNames =
            names
                .map(name => name.trim())
                .filter(Boolean);

        if (
            normalizedNames.length === 0
        ) {
            return [];
        }

        return ProductModel
            .find({
                name: {
                    $in: normalizedNames.map(
                        name =>
                            new RegExp(
                                `^${name}$`,
                                "i"
                            )
                    ),
                },
            })
            .lean()
            .exec();
    }
}