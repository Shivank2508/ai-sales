import { AgentTool } from "../agent.types";

export interface ToolContext {
    productId: string;
    question: string;
    conversationId?: string;
}

export interface Tool {
    name: AgentTool;

    description: string;

    parameters: {
        type: "object";

        properties: Record<
            string,
            unknown
        >;

        required?: string[];

        additionalProperties?: boolean;
    };

    execute(
        context: ToolContext,
        args: Record<string, unknown>
    ): Promise<unknown>;
}