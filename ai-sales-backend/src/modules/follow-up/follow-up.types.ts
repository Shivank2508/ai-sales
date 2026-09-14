export enum FollowUpStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export enum FollowUpPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
}

export enum FollowUpType {
    GENERAL = "GENERAL",
    CALL = "CALL",
    EMAIL = "EMAIL",
    DEMO = "DEMO",
    PRICING = "PRICING",
    PROPOSAL = "PROPOSAL",
}


export interface CreateFollowUpInput {
    conversationId: string;
    productId: string;
    task: string;
    type: FollowUpType;
    priority: FollowUpPriority;
    dueDate?: Date;
    scheduleSource?: FollowUpScheduleSource;
}
export enum FollowUpScheduleSource {
    CUSTOMER_REQUEST = "CUSTOMER_REQUEST",
    OUTCOME_RULE = "OUTCOME_RULE",
    DEFAULT = "DEFAULT",
}