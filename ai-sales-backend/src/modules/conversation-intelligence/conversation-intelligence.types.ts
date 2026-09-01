export enum ConversationIntent {
    INFORMATIONAL = "INFORMATIONAL",
    PRODUCT_INTEREST = "PRODUCT_INTEREST",
    PURCHASE_INTENT = "PURCHASE_INTENT",
    PRICING = "PRICING",
    SUPPORT = "SUPPORT",
    OBJECTION = "OBJECTION",
    COMPETITOR = "COMPETITOR",
    UNKNOWN = "UNKNOWN",
}

export enum ConversationSentiment {
    POSITIVE = "POSITIVE",
    Nutral = "Nutral",
    NEGATIVE = "NEGATIVE"
}

export enum ObjectionType {
    PRICE = "Price",
    PRODUCT = "PRODUCT",
    COMPETITOR = "COMPETITOR",
    CRM = "CRM",
    IMPLEMENTATION = "IMPLEMENTATION",
    SECURITY = "SECURITY",
    TIMING = "TIMING",
    TRUST = "TRUST",
    OTHER = "OTHER"
}

export enum ConversationOutcome {
    INTERESTED = "INTERESTED",
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED",
    DEMO_REQUESTED = "DEMO_REQUESTED",
    PURCHASE = "PURCHASE",
    NOT_INTERESTED = "NOT_INTERESTED",
    LOST = "LOST",
    UNKNOW = "UNKNOWN"
}

export interface ConversationObjection {
    type: ObjectionType,
    text: string,
    confidence: number
}

export interface ConversationActionItem {
    task: string,
    owner?: "SALES_REP" | "CUSTOMER" | "AI",
    dueDate?: string,
    completed?: boolean
}

export interface ConversationAnalysis {
    summary: string,
    intent: ConversationIntent,
    sentiment: ConversationSentiment,
    objections: ConversationObjection[],
    actionItems: ConversationActionItem[],
    outcome: ConversationOutcome,
    buyingSignals: string[],
    competitorMentions: string[],
    nextBestAction: string,
    confidence: number
}