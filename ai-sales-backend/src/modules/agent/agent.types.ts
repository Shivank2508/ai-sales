export type AgentTool =
    | "SEARCH_KNOWLEDGE"
    | "SEARCH_PRODUCTS"
    | "SEARCH_LEADS"
    | "LIST_DOCUMENTS"
    | "COMPARE_PRODUCTS"
    | "ANSWER"
    | "GET_SURVEY"
    | "GET_CURRENT_SURVEY_QUESTION"
    | "SUBMIT_SURVEY_ANSWER"
    | "GET_NEXT_SURVEY_QUESTION"
    | "COMPLETE_SURVEY"
    | "GET_SURVEY_PROGRESS"
    | "CREATE_SURVEY_AI"
    | "CREATE_CAMPAIGN_AI"
    | "ADD_LEADS_TO_CAMPAIGN"
    | "LAUNCH_CAMPAIGN_CALLS";

export type AgentChannel =
    | "CHAT"
    | "VOICE";

export interface AgentRequest {
    productId?: string;
    productID?: string;
    question?: string;
    message?: string;
    conversationId?: string;
    channel?: AgentChannel;
    leadId?: string;
    campaignId?: string;
    surveyId?: string;
    surveySessionId?: string;
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
    surveySession?: any;
    currentSurveyQuestion?: any;
    surveyProgress?: number;
}

export interface AgentSource {
    chunkId?: string;
    documentId?: string;
    documentName?: string;
    documentType?: string;
    score?: number;
}