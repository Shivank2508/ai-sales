import { AICampaignService } from "../../campaign/services/AICampaignService";
import { Tool, ToolContext } from "./tool.interface";

export class LaunchCampaignCallTool implements Tool {
    name = "LAUNCH_CAMPAIGN_CALLS" as const;

    description = "Initiate an AI voice call to a lead in a campaign to conduct voice survey questions and sales pitch.";

    parameters = {
        type: "object" as const,
        properties: {
            campaignId: {
                type: "string",
                description: "The campaign ID",
            },
            leadId: {
                type: "string",
                description: "The lead ID to call",
            },
        },
        required: ["campaignId", "leadId"],
        additionalProperties: false,
    };

    constructor(
        private readonly campaignService = new AICampaignService()
    ) {}

    async execute(_context: ToolContext, args: Record<string, unknown>) {
        const campaignId = String(args.campaignId || "");
        const leadId = String(args.leadId || "");

        const result = await this.campaignService.callLeadWithAI(campaignId, leadId);
        return result;
    }
}
