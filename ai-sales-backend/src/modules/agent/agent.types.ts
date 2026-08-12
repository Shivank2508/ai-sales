export type AgentTool =
    | "SEARCH_KNOWLEDGE"
    | "SEARCH_PRODUCTS"
    | "SEARCH_LEADS"
    | "LIST_DOCUMENTS"
    | "COMPARE_PRODUCTS"
    | "ANSWER";

export interface AgentRequest {

    productId: string;

    question: string;

    conversationId?: string;
}

export interface ToolExecutionResult {

    tool: AgentTool;

    success: boolean;

    data?: unknown;

    error?: string;
}

export interface AgentResponse {
    conversationId: string;
    answer: string;

    tool?: AgentTool;

    toolResult?: unknown;

    sources?: unknown[];
}