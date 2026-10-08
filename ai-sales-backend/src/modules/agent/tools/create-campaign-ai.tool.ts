import { AICampaignService } from "../../campaign/services/AICampaignService";
import { Tool, ToolContext } from "./tool.interface";

export class CreateCampaignAITool implements Tool {
    name = "CREATE_CAMPAIGN_AI" as const;

    description = "Generate an AI sales or voice outreach campaign with target audience, outreach scripts, and optional linked survey.";

    parameters = {
        type: "object" as const,
        properties: {
            goal: {
                type: "string",
                description: "Campaign objective (e.g. 'Book enterprise demos for SaaS CTOs', 'Voice survey on qualification')",
            },
            targetAudience: {
                type: "string",
                description: "Target audience description",
            },
            action: {
                type: "string",
                description: "Outreach channel: CALL, EMAIL, WHATSAPP, or SMS",
            },
            createLinkedSurvey: {
                type: "boolean",
                description: "Whether to automatically create a linked survey for lead qualification",
            },
        },
        required: ["goal"],
        additionalProperties: false,
    };

    constructor(
        private readonly campaignService = new AICampaignService()
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const goal = String(args.goal || "");
        const targetAudience = typeof args.targetAudience === "string" ? args.targetAudience : undefined;
        const action = (typeof args.action === "string" ? args.action : "CALL") as any;
        const createLinkedSurvey = args.createLinkedSurvey !== false;

        const result = await this.campaignService.generateCampaign({
            goal,
            productId: context.productId,
            targetAudience,
            action,
            createLinkedSurvey,
        });

        return {
            campaignId: result.campaign._id.toString(),
            name: result.campaign.name,
            action: result.campaign.action,
            targetAudience: result.campaign.targetAudience,
            linkedSurveyId: result.linkedSurvey?._id?.toString(),
            attachedLeadsCount: result.attachedLeadsCount,
            outreachScript: result.outreachScript,
        };
    }
}
