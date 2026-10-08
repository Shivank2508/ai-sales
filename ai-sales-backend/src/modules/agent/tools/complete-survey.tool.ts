import { SurveyExecutionService } from "../../survey/services/SurveyExecutionService";
import { Tool, ToolContext } from "./tool.interface";

export class CompleteSurveyTool implements Tool {
    name = "COMPLETE_SURVEY" as const;

    description = "Mark a survey session as completed.";

    parameters = {
        type: "object" as const,
        properties: {
            sessionId: {
                type: "string",
                description: "The survey session ID. If omitted, uses surveySessionId from context.",
            },
        },
        additionalProperties: false,
    };

    constructor(
        private readonly executionService = new SurveyExecutionService()
    ) { }

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const sessionId = (typeof args.sessionId === "string" && args.sessionId.trim())
            ? args.sessionId.trim()
            : context.surveySessionId;

        if (!sessionId) {
            throw new Error("Session ID is required to complete survey.");
        }

        const completedSession = await this.executionService.completeSurvey(sessionId);

        return {
            sessionId,
            status: completedSession?.status || "completed",
            completedAt: completedSession?.completedAt || new Date(),
        };
    }
}
