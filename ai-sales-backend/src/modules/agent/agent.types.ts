export type AgentTool =
    | "SEARCH_KNOWLEDGE"
    | "SEARCH_PRODUCTS"
    | "SEARCH_LEADS"
    | "LIST_DOCUMENTS"
    | "COMPARE_PRODUCTS"
    | "ANSWER";

export type AgentChannel =
    | "CHAT"
    | "VOICE";

export interface AgentRequest {

    productId: string;

    question: string;

    conversationId?: string;

    channel?: AgentChannel;
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

    sources?: AgentSource[];
}

export interface AgentSource {

    chunkId?: string;

    documentId?: string;

    documentName?: string;

    documentType?: string;

    score?: number;
}