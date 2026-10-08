import { AISurveyGeneratorService } from "../../survey/services/AISurveyGeneratorService";
import { Tool, ToolContext } from "./tool.interface";

export class CreateSurveyAITool implements Tool {
    name = "CREATE_SURVEY_AI" as const;

    description = "Generate a new survey with questions and options using AI based on a topic and target audience.";

    parameters = {
        type: "object" as const,
        properties: {
            topic: {
                type: "string",
                description: "The topic or goal of the survey (e.g. 'Customer Satisfaction', 'Feature Feedback', 'Pricing Evaluation')",
            },
            targetAudience: {
                type: "string",
                description: "Target demographic or buyer persona",
            },
            questionCount: {
                type: "number",
                description: "Number of questions to generate (default 5)",
            },
            channel: {
                type: "string",
                description: "VOICE or CHAT or WEB",
            },
        },
        required: ["topic"],
        additionalProperties: false,
    };

    constructor(
        private readonly generator = new AISurveyGeneratorService()
    ) {}

    async execute(context: ToolContext, args: Record<string, unknown>) {
        const topic = String(args.topic || "");
        const targetAudience = typeof args.targetAudience === "string" ? args.targetAudience : undefined;
        const questionCount = typeof args.questionCount === "number" ? args.questionCount : 5;
        const channel = (typeof args.channel === "string" ? args.channel : "VOICE") as any;

        const result = await this.generator.generateSurvey({
            topic,
            productId: context.productId,
            targetAudience,
            questionCount,
            channel,
        });

        return {
            surveyId: result.survey._id.toString(),
            title: result.survey.title,
            questionsCount: result.questions.length,
            questions: result.questions.map((q: any) => ({
                id: q._id.toString(),
                text: q.questionText,
                type: q.questionType,
                options: q.options,
            })),
        };
    }
}
