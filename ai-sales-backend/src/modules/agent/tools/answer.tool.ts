import {
    Tool,
    ToolContext,
} from "./tool.interface";

export class AnswerTool
    implements Tool {

    name = "ANSWER" as const;

    description =
        "Answer simple conversational questions that do not require searching business data.";

    parameters = {
        type: "object" as const,

        properties: {
            question: {
                type: "string",

                description:
                    "The user's question.",
            },
        },

        required: [
            "question",
        ],

        additionalProperties: false,
    };

    async execute(
        context: ToolContext,
        args: Record<string, unknown>
    ) {

        const question =
            typeof args.question === "string"
                ? args.question
                : context.question;

        return {
            type: "DIRECT_ANSWER",

            question,
        };
    }
}