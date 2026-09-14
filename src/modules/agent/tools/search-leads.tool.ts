

import { LeadRepositry } from "../../leads/lead.repository";
import {
    Tool,
    ToolContext,
} from "./tool.interface";

export class SearchLeadsTool
    implements Tool {

    name = "SEARCH_LEADS" as const;

    description =
        "Search sales leads by name, email, or company.";

    parameters = {
        type: "object" as const,

        properties: {
            searchTerm: {
                type: "string",

                description:
                    "Lead name, email address, or company name.",
            },
        },

        required: [
            "searchTerm",
        ],

        additionalProperties: false,
    };

    constructor(
        private readonly leadRepository =
            new LeadRepositry()
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

        return this.leadRepository.search(
            searchTerm
        );
    }
}