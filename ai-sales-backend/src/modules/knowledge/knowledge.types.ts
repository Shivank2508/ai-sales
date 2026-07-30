export const KNOWLEDGE_TYPES = [
    // Product
    "PRODUCT_INFO",
    "PRODUCT_FEATURE",
    "PRODUCT_BENEFIT",
    "USE_CASE",
    "PRICING",
    "PACKAGING",
    "INTEGRATION",
    "TECHNICAL_INFO",

    // Sales
    "FAQ",
    "OBJECTION",
    "SALES_PLAYBOOK",
    "SALES_SCRIPT",
    "TALK_TRACK",
    "DISCOVERY_QUESTION",
    "QUALIFICATION_CRITERIA",
    "VALUE_PROPOSITION",
    "ELEVATOR_PITCH",

    // Competitive intelligence
    "COMPETITOR",
    "COMPETITOR_COMPARISON",
    "BATTLECARD",

    // Proof / customer success
    "CASE_STUDY",
    "TESTIMONIAL",
    "CUSTOMER_STORY",
    "ROI_DATA",

    // Process
    "SALES_PROCESS",
    "FOLLOW_UP_GUIDE",
    "DEMO_GUIDE",
    "NEGOTIATION_GUIDE",
    "CLOSING_GUIDE",

    // Policies / Legal
    "POLICY",
    "TERMS",
    "COMPLIANCE",
    "LEGAL",

    // AI Agent
    "CALL_SCRIPT",
    "CALL_GUIDELINE",
    "ESCALATION_RULE",
    "RESPONSE_GUIDELINE",

    // General
    "DOCUMENTATION",
    "OTHER",
] as const;

export type KnowledgeType =
    (typeof KNOWLEDGE_TYPES)[number];

export interface CreateKnowledgeInput {
    productId: string;

    type: KnowledgeType;

    title: string;
    content: string;

    tags?: string[];
}

export interface UpdateKnowledgeInput {
    type?: KnowledgeType;

    title?: string;
    content?: string;

    tags?: string[];
}