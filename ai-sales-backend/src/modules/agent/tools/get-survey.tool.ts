import { SurveyRepository } from "../../survey/repositories/SurveyRepository";
import { SurveyQuestionRepository } from "../../survey/repositories/SurveyQuestionRepository";
import { Tool, ToolContext } from "./tool.interface";

export class GetSurveyTool implements Tool {
    name = "GET_SURVEY" as const;

    description = "Retrieve details and questions of a survey by survey ID or campaign.";

    parameters = {
        type: "object" as const,
        properties: {
            surveyId: {
                type: "string",
                description: "The unique ID of the survey. If omitted, uses surveyId from context.",
            },
        },
        additionalProperties: false,
    };

    constructor(
        private readonly surveyRepository = new SurveyRepository(),
        private readonly questionRepository = new SurveyQuestionRepository()
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const surveyId = (typeof args.surveyId === "string" && args.surveyId.trim())
            ? args.surveyId.trim()
            : context.surveyId;

        if (!surveyId) {
            throw new Error("Survey ID is required.");
        }

        const survey = await this.surveyRepository.findById(surveyId);
        if (!survey) {
            throw new Error(`Survey with ID ${surveyId} not found.`);
        }

        const questions = await this.questionRepository.findBySurveyId(surveyId);

        return {
            surveyId: survey._id,
            name: survey.name,
            welcomeMessage: survey.welcomeMessage,
            totalQuestions: questions.length,
            questions: questions.map((q) => ({
                questionId: q.questionId,
                order: q.order,
                text: q.text,
                type: q.type,
                options: q.options,
            })),
        };
    }
}
