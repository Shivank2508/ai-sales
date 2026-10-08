import { AISurveyFlowService } from "../../survey/services/AISurveyFlowService";
import { Tool, ToolContext } from "./tool.interface";

export class SubmitSurveyAnswerTool implements Tool {
    name = "SUBMIT_SURVEY_ANSWER" as const;

    description = "Submit a customer natural-language answer to the current survey question. Automatically extracts structured values, evaluates condition branching, and moves to the next question.";

    parameters = {
        type: "object" as const,
        properties: {
            sessionId: {
                type: "string",
                description: "The survey session ID. If omitted, uses surveySessionId from context.",
            },
            answer: {
                type: "string",
                description: "The customer's natural language answer or selection.",
            },
        },
        required: ["answer"],
        additionalProperties: false,
    };

    constructor(
        private readonly aiSurveyFlowService = new AISurveyFlowService()
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const sessionId = (typeof args.sessionId === "string" && args.sessionId.trim())
            ? args.sessionId.trim()
            : context.surveySessionId;

        const rawAnswer = (typeof args.answer === "string" && args.answer.trim())
            ? args.answer.trim()
            : context.question;

        if (!sessionId) {
            throw new Error("Session ID is required to submit a survey answer.");
        }

        if (!rawAnswer) {
            throw new Error("Answer content is required.");
        }

        const result = await this.aiSurveyFlowService.processTurn({
            sessionId,
            customerMessage: rawAnswer,
        });

        return {
            sessionId: result.sessionId,
            status: result.status,
            completed: result.completed,
            completionPercentage: result.completionPercentage,
            extractedAnswer: result.extractedAnswer,
            nextQuestion: result.nextQuestion,
            agentMessage: result.agentMessage,
        };
    }
}
