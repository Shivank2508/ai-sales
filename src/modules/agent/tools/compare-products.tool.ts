import { ProductRepository } from "../../products/product.repository";

import {
    Tool,
    ToolContext,
} from "./tool.interface";

export interface ProductComparisonResult {

    productA: unknown;

    productB: unknown;

    comparison: {
        features: {
            productA: unknown;
            productB: unknown;
        };

        benefits: {
            productA: unknown;
            productB: unknown;
        };

        targetCustomers: {
            productA: unknown;
            productB: unknown;
        };
    };
}

export class CompareProductsTool
    implements Tool {

    name = "COMPARE_PRODUCTS" as const;

    description =
        "Compare two products using features, benefits, target customers, category, and product information.";

    parameters = {
        type: "object" as const,

        properties: {
            productNames: {
                type: "array",

                description:
                    "Exactly two product names to compare.",

                items: {
                    type: "string",
                },

                minItems: 2,

                maxItems: 2,
            },
        },

        required: [
            "productNames",
        ],

        additionalProperties: false,
    };

    constructor(
        private readonly productRepository =
            new ProductRepository()
    ) { }

    async execute(
        _context: ToolContext,
        args: Record<string, unknown>
    ): Promise<ProductComparisonResult> {

        const productNames =
            args.productNames;

        if (
            !Array.isArray(productNames)
        ) {
            throw new Error(
                "productNames must be an array."
            );
        }

        if (
            productNames.length !== 2
        ) {
            throw new Error(
                "Exactly two product names are required."
            );
        }

        const names =
            productNames.filter(
                (
                    name
                ): name is string =>
                    typeof name === "string" &&
                    name.trim().length > 0
            );

        if (
            names.length !== 2
        ) {
            throw new Error(
                "Both product names are required."
            );
        }

        const products =
            await this.productRepository
                .findByNames(names);

        if (
            products.length !== 2
        ) {
            throw new Error(
                "Both products could not be found."
            );
        }

        const [
            productA,
            productB,
        ] = products;

        return {

            productA: {
                id:
                    productA._id.toString(),

                name:
                    productA.name,

                description:
                    productA.description,

                category:
                    productA.category,

                features:
                    productA.features,

                benefits:
                    productA.benefit,

                targetCustomers:
                    productA.targetcustomer,
            },

            productB: {
                id:
                    productB._id.toString(),

                name:
                    productB.name,

                description:
                    productB.description,

                category:
                    productB.category,

                features:
                    productB.features,

                benefits:
                    productB.benefit,

                targetCustomers:
                    productB.targetcustomer,
            },

            comparison: {

                features: {
                    productA:
                        productA.features,

                    productB:
                        productB.features,
                },

                benefits: {
                    productA:
                        productA.benefit,

                    productB:
                        productB.benefit,
                },

                targetCustomers: {
                    productA:
                        productA.targetcustomer,

                    productB:
                        productB.targetcustomer,
                },
            },
        };
    }
}