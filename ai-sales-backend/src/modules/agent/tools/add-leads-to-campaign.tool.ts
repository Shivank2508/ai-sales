import { AICampaignService } from "../../campaign/services/AICampaignService";
import { Tool, ToolContext } from "./tool.interface";

export class AddLeadsToCampaignTool implements Tool {
    name = "ADD_LEADS_TO_CAMPAIGN" as const;

    description = "Add lead IDs into a campaign audience for execution.";

    parameters = {
        type: "object" as const,
        properties: {
            campaignId: {
                type: "string",
                description: "The campaign ID",
            },
            leadIds: {
                type: "array",
                items: { type: "string" },
                description: "Array of lead IDs to associate with this campaign",
            },
        },
        required: ["campaignId", "leadIds"],
        additionalProperties: false,
    };

    constructor(
        private readonly campaignService = new AICampaignService()
    ) {}

    async execute(_context: ToolContext, args: Record<string, unknown>) {
        const campaignId = String(args.campaignId || "");
        const leadIds = Array.isArray(args.leadIds) ? args.leadIds.map(String) : [];

        const result = await this.campaignService.addLeadsToCampaign(campaignId, leadIds);
        return result;
    }
}
