import { SurveyExecutionService } from "../../survey/services/SurveyExecutionService";
import { Tool, ToolContext } from "./tool.interface";

export class GetCurrentSurveyQuestionTool implements Tool {
    name = "GET_CURRENT_SURVEY_QUESTION" as const;

    description = "Get the current active question for an ongoing survey session.";

    parameters = {
        type: "object" as const,
        properties: {
            sessionId: {
                type: "string",
                description: "Survey session ID. If omitted, uses surveySessionId from context.",
            },
        },
        additionalProperties: false,
    };

    constructor(
        private readonly executionService = new SurveyExecutionService()
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const sessionId = (typeof args.sessionId === "string" && args.sessionId.trim())
            ? args.sessionId.trim()
            : context.surveySessionId;

        if (!sessionId) {
            throw new Error("Session ID is required to get current survey question.");
        }

        const question = await this.executionService.getCurrentQuestion(sessionId);
        const session = await this.executionService.getSurveySession(sessionId);

        return {
            sessionId,
            currentQuestion: question,
            sessionStatus: session?.status,
            progress: session?.completionPercentage || 0,
        };
    }
}
