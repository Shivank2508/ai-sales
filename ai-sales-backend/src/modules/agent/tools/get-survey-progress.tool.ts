import { SurveyExecutionService } from "../../survey/services/SurveyExecutionService";
import { Tool, ToolContext } from "./tool.interface";

export class GetSurveyProgressTool implements Tool {
    name = "GET_SURVEY_PROGRESS" as const;

    description = "Check progress, answered questions, completion percentage, and current status of a survey session.";

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
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const sessionId = (typeof args.sessionId === "string" && args.sessionId.trim())
            ? args.sessionId.trim()
            : context.surveySessionId;

        if (!sessionId) {
            throw new Error("Session ID is required to get survey progress.");
        }

        const session = await this.executionService.getSurveySession(sessionId);
        if (!session) {
            throw new Error(`Survey session ${sessionId} not found.`);
        }

        return {
            sessionId,
            status: session.status,
            currentQuestionId: session.currentQuestionId,
            totalAnswersCount: session.answers.length,
            completionPercentage: session.completionPercentage,
            answers: session.answers,
        };
    }
}
