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
    conversationId?: string
}

export interface ToolExecutionResult {
    tooL: AgentTool;
    answer: string;
    sources: unknown[]
}   