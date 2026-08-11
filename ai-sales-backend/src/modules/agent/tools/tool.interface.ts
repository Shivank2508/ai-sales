import { AgentTool } from "../agent.types";

export interface ToolContext {
    productId: string;
    question: string
}


export interface Tool {
    name: AgentTool;
    description: string;
    execute(
        context: ToolContext
    ): Promise<any>
}