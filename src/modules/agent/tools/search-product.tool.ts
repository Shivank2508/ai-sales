import { ProductRepository } from "../../products/product.repository";

import {
    Tool,
    ToolContext,
} from "./tool.interface";

export class SearchProductTool
    implements Tool {

    name = "SEARCH_PRODUCTS" as const;

    description =
        "Search products using their name, description, or category.";

    parameters = {
        type: "object" as const,

        properties: {
            searchTerm: {
                type: "string",

                description:
                    "Product name, category, or keyword to search for.",
            },
        },

        required: [
            "searchTerm",
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
    ) {

        const searchTerm =
            typeof args.searchTerm === "string"
                ? args.searchTerm
                : "";

        if (!searchTerm.trim()) {
            throw new Error(
                "Search term is required."
            );
        }

        return this.productRepository.search(
            searchTerm
        );
    }
}