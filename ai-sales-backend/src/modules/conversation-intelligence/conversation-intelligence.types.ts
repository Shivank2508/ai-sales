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
<<<<<<< HEAD
    NEUTRAL = "NEUTRAL",
    NEGATIVE = "NEGATIVE",
}

export enum ObjectionType {
    PRICE = "PRICE",
=======
    Nutral = "Nutral",
    NEGATIVE = "NEGATIVE"
}

export enum ObjectionType {
    PRICE = "Price",
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    PRODUCT = "PRODUCT",
    COMPETITOR = "COMPETITOR",
    CRM = "CRM",
    IMPLEMENTATION = "IMPLEMENTATION",
    SECURITY = "SECURITY",
    TIMING = "TIMING",
    TRUST = "TRUST",
<<<<<<< HEAD
    OTHER = "OTHER",
=======
    OTHER = "OTHER"
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}

export enum ConversationOutcome {
    INTERESTED = "INTERESTED",
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED",
    DEMO_REQUESTED = "DEMO_REQUESTED",
    PURCHASE = "PURCHASE",
    NOT_INTERESTED = "NOT_INTERESTED",
    LOST = "LOST",
<<<<<<< HEAD
    UNKNOWN = "UNKNOWN",
}

export interface ConversationObjection {
    type: ObjectionType | string;
    text: string;
    confidence: number;
}

export interface ConversationActionItem {
    task: string;
    owner?: "SALES_REP" | "CUSTOMER" | "AI";
    dueDate?: string;
    completed?: boolean;
}

export interface SentimentAnalysis {
    label: "positive" | "neutral" | "negative" | string;
    score: number;
}

export interface ConversationAnalysis {
    conversationId?: string;
    summary: string;
    intent: ConversationIntent | string;
    sentiment: ConversationSentiment | string;
    sentimentScore?: number;
    sentimentDetails?: SentimentAnalysis;
    topics?: string[];
    painPoints?: string[];
    objections: ConversationObjection[];
    actionItems: ConversationActionItem[];
    outcome: ConversationOutcome | string;
    buyingSignals: string[];
    competitorMentions: string[];
    customerNeeds?: string[];
    productInterest?: string[];
    nextBestAction: string;
    recommendedAction?: string;
    leadScore?: number;
    confidence: number;
}

export interface ConversationTranscriptMessage {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: Date;
=======
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

export interface ConversationTranscriptMessage {
    role: | "user" | "assistant";
    content: string;
    createdAt?: Date
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}

export interface ConversationTranscript {
    conversationId: string;
    productId: string;
    messages: ConversationTranscriptMessage[];
<<<<<<< HEAD
    text: string;
}
=======
    text: string
}

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
