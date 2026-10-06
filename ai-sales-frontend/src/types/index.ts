// ==========================================
// AI SALES INTELLIGENCE - CORE DOMAIN TYPES
// ==========================================

export enum CampaignStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum CampaignType {
  SURVEY = "survey",
  SALES = "sales",
  FEEDBACK = "feedback",
  PRODUCT_RESEARCH = "product_research",
  CUSTOMER_RETENTION = "customer_retention",
}

export interface ICampaign {
  _id: string;
  name: string;
  description?: string;
  businessId: string;
  businessName?: string;
  type: CampaignType;
  status: CampaignStatus;
  product?: string;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  language?: string;
  surveyId?: string;
  agentId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Computed metrics
  responsesCount?: number;
  completedResponsesCount?: number;
  completionRate?: number;
  avgDurationSeconds?: number;
  positiveIntentPercentage?: number;
  negativeIntentPercentage?: number;
  neutralIntentPercentage?: number;
}

export enum SurveyStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum QuestionType {
  YES_NO = "yes_no",
  SINGLE_CHOICE = "single_choice",
  MULTIPLE_CHOICE = "multiple_choice",
  TEXT = "text",
  NUMBER = "number",
  RATING = "rating",
  DATE = "date",
  AI_CLASSIFICATION = "ai_classification",
  AI_INTENT = "ai_intent",
}

export enum QuestionAction {
  NEXT = "next",
  END_SURVEY = "end_survey",
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal";

export interface IQuestionOption {
  id?: string;
  value: string;
  label: string;
}

export interface IQuestionConditionRule {
  id: string;
  questionId: string; // Source question to evaluate
  operator: ConditionOperator;
  value: string | number | string[];
}

export interface IQuestionConditionGroup {
  id: string;
  logic: "AND" | "OR";
  rules: IQuestionConditionRule[];
  action: QuestionAction;
  nextQuestionId?: string; // Jump target question if action === NEXT
}

export interface ISurveyQuestion {
  _id?: string;
  surveyId?: string;
  questionId: string;
  order: number;
  type: QuestionType;
  text: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  allowMultiple?: boolean;
  options?: IQuestionOption[];
  
  // Validation constraints
  minValue?: number;
  maxValue?: number;
  minSelections?: number;
  maxSelections?: number;
  allowDontKnow?: boolean;
  allowPreferNotToAnswer?: boolean;

  // AI & Voice properties
  aiPrompt?: string;
  aiExtractionInstructions?: string;
  expectedAnswerFormat?: string;

  // Conditions
  conditionGroups?: IQuestionConditionGroup[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISurvey {
  _id: string;
  campaignId: string;
  name: string;
  description?: string;
  version: number;
  status: SurveyStatus;
  language: string;
  welcomeMessage?: string;
  endMessage?: string;
  maxQuestions?: number;
  aiSystemPrompt?: string;
  questions?: ISurveyQuestion[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Survey Validation
export interface IValidationIssue {
  id: string;
  category: "survey" | "question" | "condition" | "flow";
  level: "error" | "warning";
  title: string;
  message: string;
  questionId?: string;
}

export interface ISurveyValidationResult {
  isValid: boolean;
  score: number;
  issues: IValidationIssue[];
  passedChecks: string[];
}

// Survey Responses & Transcripts
export enum ResponseStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  FAILED = "failed",
}

export interface ISurveyAnswer {
  questionId: string;
  questionText?: string;
  rawAnswer: string;
  normalizedAnswer: any;
  confidence?: number;
  extractedBy: "ai" | "user_input" | "voice_model";
  intent?: string;
  answeredAt: string;
}

export interface ISurveyResponse {
  _id: string;
  responseId: string;
  surveyId: string;
  campaignId: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  conversationId?: string;
  status: ResponseStatus;
  currentQuestionId?: string;
  answers: ISurveyAnswer[];
  completionPercentage: number;
  durationSeconds?: number;
  overallIntent?: "positive" | "negative" | "neutral" | "maybe";
  startedAt: string;
  completedAt?: string;
}

// Conversations
export interface IConversationMessage {
  id: string;
  sender: "ai" | "customer";
  text: string;
  audioUrl?: string;
  timestamp: string;
  questionId?: string;
  channel: "voice" | "text" | "web";
  aiConfidence?: number;
  detectedIntent?: string;
  detectedEntities?: Array<{ name: string; value: string }>;
}

export interface IConversation {
  _id: string;
  conversationId: string;
  campaignId: string;
  campaignName: string;
  leadId?: string;
  customerName: string;
  customerPhone?: string;
  agentId: string;
  agentName: string;
  status: "active" | "completed" | "interrupted" | "failed";
  channel: "voice" | "text" | "multimodal";
  durationSeconds: number;
  summary?: string;
  sentiment: "positive" | "neutral" | "negative";
  messages: IConversationMessage[];
  startedAt: string;
  endedAt?: string;
}

// AI Agents
export enum AgentStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  BUSY = "busy",
  TESTING = "testing",
}

export interface IAIAgent {
  _id: string;
  agentId: string;
  name: string;
  avatar?: string;
  description: string;
  status: AgentStatus;
  voiceName: string;
  language: string;
  supportedLanguages: string[];
  capabilities: ("voice" | "text" | "inbound" | "outbound")[];
  assignedCampaignIds: string[];
  totalConversations: number;
  successRate: number;
  avgResponseTimeMs: number;
  systemPrompt: string;
  knowledgeBaseIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Analytics
export interface ICampaignAnalytics {
  campaignId: string;
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageDurationSeconds: number;
  intentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    maybe: number;
  };
  questionDropOffs: Array<{
    questionId: string;
    questionText: string;
    reachedCount: number;
    dropOffCount: number;
    dropOffRate: number;
  }>;
  brandDistribution?: Array<{
    brand: string;
    count: number;
    percentage: number;
  }>;
  nonPurchaseReasons?: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  responsesOverTime: Array<{
    date: string;
    responses: number;
    completed: number;
  }>;
  aiInsights: string[];
}

// Leads & Knowledge
export interface ILead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  segment?: string;
  lastContactedAt?: string;
}

export interface IKnowledgeDocument {
  _id: string;
  title: string;
  type: "pdf" | "docx" | "faq" | "product_spec" | "url";
  category: string;
  chunkCount: number;
  sizeBytes: number;
  status: "indexed" | "processing" | "failed";
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  features: string[];
}
