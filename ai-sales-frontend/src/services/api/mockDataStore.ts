import {
  CampaignStatus,
  CampaignType,
  IAIAgent,
  ICampaign,
  ICampaignAnalytics,
  IConversation,
  ISurvey,
  ISurveyResponse,
  QuestionAction,
  QuestionType,
  ResponseStatus,
  SurveyStatus,
} from "../../types";

const LOCAL_STORAGE_KEY_PREFIX = "ai_sales_v2_";

// ==========================================
// SEED CAMPAIGNS
// ==========================================
export const SEED_CAMPAIGNS: ICampaign[] = [
  {
    _id: "camp-guard-01",
    name: "Guard Razor Consumer Study",
    description: "Voice AI consumer research on Gillette Guard purchasing behavior, repeat intent, and shaving habits.",
    businessId: "biz-pg-01",
    businessName: "Procter & Gamble Consumer Insights",
    type: CampaignType.PRODUCT_RESEARCH,
    status: CampaignStatus.ACTIVE,
    product: "Gillette Guard",
    startDate: "2026-09-01",
    endDate: "2026-11-30",
    targetAudience: "Male consumers age 18-45 in tier 2/3 cities",
    language: "en-IN",
    surveyId: "surv-guard-01",
    agentId: "agent-sarah-01",
    createdBy: "user-insights-lead",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-10-05T09:30:00.000Z",
    responsesCount: 428,
    completedResponsesCount: 382,
    completionRate: 89,
    avgDurationSeconds: 114,
    positiveIntentPercentage: 68,
    negativeIntentPercentage: 18,
    neutralIntentPercentage: 14,
  },
  {
    _id: "camp-b2b-saas",
    name: "Enterprise Voice CRM Lead Qualification",
    description: "Inbound discovery calls qualifying high-intent B2B software prospects on budget, team size, and CRM stack.",
    businessId: "biz-pg-01",
    businessName: "AgentFlow Enterprise",
    type: CampaignType.SALES,
    status: CampaignStatus.DRAFT,
    product: "Voice AI Sales Suite",
    startDate: "2026-10-10",
    endDate: "2026-12-31",
    targetAudience: "VPs of Sales and Revenue Operations",
    language: "en-US",
    surveyId: "surv-b2b-01",
    agentId: "agent-alex-02",
    createdBy: "user-insights-lead",
    createdAt: "2026-10-02T11:00:00.000Z",
    updatedAt: "2026-10-02T11:00:00.000Z",
    responsesCount: 0,
    completedResponsesCount: 0,
    completionRate: 0,
    avgDurationSeconds: 0,
    positiveIntentPercentage: 0,
    negativeIntentPercentage: 0,
    neutralIntentPercentage: 0,
  },
  {
    _id: "camp-retention-03",
    name: "Customer Onboarding & CSAT Health Check",
    description: "Proactive 14-day check-in evaluating initial user setup ease, friction points, and customer success handoff.",
    businessId: "biz-pg-01",
    businessName: "AgentFlow Enterprise",
    type: CampaignType.CUSTOMER_RETENTION,
    status: CampaignStatus.PAUSED,
    product: "Platform Core",
    startDate: "2026-08-15",
    endDate: "2026-10-15",
    targetAudience: "Newly onboarded workspace admins",
    language: "en-US",
    surveyId: "surv-retention-01",
    agentId: "agent-sarah-01",
    createdBy: "user-insights-lead",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-10-01T15:00:00.000Z",
    responsesCount: 195,
    completedResponsesCount: 182,
    completionRate: 93,
    avgDurationSeconds: 95,
    positiveIntentPercentage: 82,
    negativeIntentPercentage: 8,
    neutralIntentPercentage: 10,
  },
];

// ==========================================
// SEED SURVEYS (Generic configuration driven)
// ==========================================
export const SEED_SURVEYS: Record<string, ISurvey> = {
  "surv-guard-01": {
    _id: "surv-guard-01",
    campaignId: "camp-guard-01",
    name: "Gillette Guard Consumer Feedback Survey",
    description: "5-question dynamic consumer study evaluating purchase memory, brand selection, prior habits, repeat intent, and friction reasons.",
    version: 1,
    status: SurveyStatus.ACTIVE,
    language: "en-IN",
    welcomeMessage: "Namaste! This is Sarah calling on behalf of Gillette Consumer Research. Do you have 2 quick minutes to share your shaving experience?",
    endMessage: "Thank you so much for your valuable feedback! We truly appreciate your time. Have a wonderful day!",
    maxQuestions: 5,
    aiSystemPrompt: "Speak in a polite, conversational tone. Accurately transcribe Indian brand references and user sentiments.",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-10-05T09:30:00.000Z",
    questions: [
      {
        questionId: "q1",
        order: 1,
        type: QuestionType.YES_NO,
        text: "Do you remember purchasing a Gillette Guard razor?",
        description: "Filter question to ensure respondent has tried the product.",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        aiExtractionInstructions: "Extract affirmative or negative confirmation.",
        expectedAnswerFormat: "Boolean: 'yes' or 'no'",
        conditionGroups: [
          {
            id: "cond-g-q1-no",
            logic: "AND",
            rules: [
              {
                id: "rule-q1-1",
                questionId: "q1",
                operator: "equals",
                value: "no",
              },
            ],
            action: QuestionAction.END_SURVEY,
          },
        ],
      },
      {
        questionId: "q2",
        order: 2,
        type: QuestionType.SINGLE_CHOICE,
        text: "What brand did you purchase?",
        description: "Brand identification check.",
        required: true,
        options: [
          { value: "gillette_guard", label: "Gillette Guard" },
          { value: "any_other_gillette", label: "Any other Gillette" },
          { value: "any_other_brands", label: "Any other brands" },
        ],
        aiExtractionInstructions: "Match spoken razor brand to the closest option.",
        expectedAnswerFormat: "Single choice option key",
      },
      {
        questionId: "q3",
        order: 3,
        type: QuestionType.MULTIPLE_CHOICE,
        text: "How did you shave before Guard?",
        description: "Prior shaving habit discovery. Multiple answers allowed.",
        required: true,
        allowMultiple: true,
        options: [
          { value: "barber", label: "Barber" },
          { value: "disposable_razor", label: "Disposable razor" },
          { value: "trimmer", label: "Trimmer" },
          { value: "mach3", label: "Mach3" },
          { value: "fusion", label: "Fusion" },
          { value: "other", label: "Other" },
        ],
        aiExtractionInstructions: "Identify all prior methods mentioned by the user.",
        expectedAnswerFormat: "Array of matching option values",
      },
      {
        questionId: "q4",
        order: 4,
        type: QuestionType.SINGLE_CHOICE,
        text: "Will you purchase Guard razor or cartridges again?",
        description: "Repeat purchase intent measurement.",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "maybe", label: "Maybe" },
          { value: "no", label: "No" },
        ],
        aiExtractionInstructions: "Classify purchase intent: 'yes', 'maybe', or 'no'.",
        conditionGroups: [
          {
            id: "cond-g-q4-no",
            logic: "AND",
            rules: [
              {
                id: "rule-q4-1",
                questionId: "q4",
                operator: "equals",
                value: "no",
              },
            ],
            action: QuestionAction.NEXT,
            nextQuestionId: "q5",
          },
          {
            id: "cond-g-q4-yes-maybe",
            logic: "OR",
            rules: [
              {
                id: "rule-q4-yes",
                questionId: "q4",
                operator: "equals",
                value: "yes",
              },
              {
                id: "rule-q4-maybe",
                questionId: "q4",
                operator: "equals",
                value: "maybe",
              },
            ],
            action: QuestionAction.END_SURVEY,
          },
        ],
      },
      {
        questionId: "q5",
        order: 5,
        type: QuestionType.SINGLE_CHOICE,
        text: "Why will you not purchase Guard again?",
        description: "Root cause analysis for churned / non-repeat respondents. Only asked if Q4 = No.",
        required: true,
        options: [
          { value: "similar_benefits", label: "Current razor provides similar benefits" },
          { value: "irritation", label: "Irritation" },
          { value: "cuts", label: "Cuts" },
          { value: "blade_life", label: "Blade life" },
          { value: "hair_getting_stuck", label: "Hair getting stuck" },
          { value: "no_recommendation", label: "No recommendation" },
          { value: "availability", label: "Availability" },
          { value: "other", label: "Other" },
        ],
        aiExtractionInstructions: "Capture primary obstacle or dissatisfaction reason.",
        conditionGroups: [
          {
            id: "cond-g-q5-end",
            logic: "AND",
            rules: [],
            action: QuestionAction.END_SURVEY,
          },
        ],
      },
    ],
  },
  "surv-b2b-01": {
    _id: "surv-b2b-01",
    campaignId: "camp-b2b-saas",
    name: "B2B Inbound Discovery Survey",
    description: "Captures company rep count, budget range, and current CRM software.",
    version: 1,
    status: SurveyStatus.DRAFT,
    language: "en-US",
    welcomeMessage: "Thanks for checking out AgentFlow! Let's get a few quick details to customize your sales demo.",
    endMessage: "Awesome! An account executive will reach out shortly with customized pricing.",
    maxQuestions: 3,
    questions: [
      {
        questionId: "b2b_q1",
        order: 1,
        type: QuestionType.SINGLE_CHOICE,
        text: "How many sales representatives are on your team?",
        required: true,
        options: [
          { value: "1_10", label: "1 - 10 reps" },
          { value: "11_50", label: "11 - 50 reps" },
          { value: "51_plus", label: "51+ reps (Enterprise)" },
        ],
      },
      {
        questionId: "b2b_q2",
        order: 2,
        type: QuestionType.SINGLE_CHOICE,
        text: "What CRM platform do you currently use?",
        required: true,
        options: [
          { value: "salesforce", label: "Salesforce" },
          { value: "hubspot", label: "HubSpot" },
          { value: "zoho", label: "Zoho CRM" },
          { value: "other", label: "Custom / Other" },
        ],
      },
    ],
  },
};

// ==========================================
// SEED RESPONSES
// ==========================================
export const SEED_RESPONSES: ISurveyResponse[] = [
  {
    _id: "resp-001",
    responseId: "R-94821",
    surveyId: "surv-guard-01",
    campaignId: "camp-guard-01",
    leadName: "Rahul Sharma",
    leadPhone: "+91 98765 43210",
    leadEmail: "rahul.sharma@example.com",
    status: ResponseStatus.COMPLETED,
    completionPercentage: 100,
    durationSeconds: 125,
    overallIntent: "positive",
    startedAt: "2026-10-04T10:14:00.000Z",
    completedAt: "2026-10-04T10:16:05.000Z",
    answers: [
      {
        questionId: "q1",
        questionText: "Do you remember purchasing a Gillette Guard razor?",
        rawAnswer: "Yes, I bought it last week from the local store.",
        normalizedAnswer: "yes",
        confidence: 0.98,
        extractedBy: "ai",
        answeredAt: "2026-10-04T10:14:20.000Z",
      },
      {
        questionId: "q2",
        questionText: "What brand did you purchase?",
        rawAnswer: "It was Gillette Guard single blade razor.",
        normalizedAnswer: "gillette_guard",
        confidence: 0.96,
        extractedBy: "ai",
        answeredAt: "2026-10-04T10:14:50.000Z",
      },
      {
        questionId: "q3",
        questionText: "How did you shave before Guard?",
        rawAnswer: "I used to go to the local barber shop or use simple disposable razors.",
        normalizedAnswer: ["barber", "disposable_razor"],
        confidence: 0.94,
        extractedBy: "ai",
        answeredAt: "2026-10-04T10:15:30.000Z",
      },
      {
        questionId: "q4",
        questionText: "Will you purchase Guard razor or cartridges again?",
        rawAnswer: "Definitely yes, it's very smooth and easy to wash.",
        normalizedAnswer: "yes",
        confidence: 0.97,
        extractedBy: "ai",
        intent: "POSITIVE_REPEAT_BUYER",
        answeredAt: "2026-10-04T10:16:00.000Z",
      },
    ],
  },
  {
    _id: "resp-002",
    responseId: "R-94822",
    surveyId: "surv-guard-01",
    campaignId: "camp-guard-01",
    leadName: "Amit Verma",
    leadPhone: "+91 98111 22334",
    status: ResponseStatus.COMPLETED,
    completionPercentage: 100,
    durationSeconds: 140,
    overallIntent: "negative",
    startedAt: "2026-10-04T11:20:00.000Z",
    completedAt: "2026-10-04T11:22:20.000Z",
    answers: [
      {
        questionId: "q1",
        questionText: "Do you remember purchasing a Gillette Guard razor?",
        rawAnswer: "Yes I do.",
        normalizedAnswer: "yes",
        confidence: 0.99,
        extractedBy: "ai",
        answeredAt: "2026-10-04T11:20:15.000Z",
      },
      {
        questionId: "q2",
        questionText: "What brand did you purchase?",
        rawAnswer: "Gillette Guard pack of two.",
        normalizedAnswer: "gillette_guard",
        confidence: 0.95,
        extractedBy: "ai",
        answeredAt: "2026-10-04T11:20:45.000Z",
      },
      {
        questionId: "q3",
        questionText: "How did you shave before Guard?",
        rawAnswer: "I used an electric trimmer.",
        normalizedAnswer: ["trimmer"],
        confidence: 0.93,
        extractedBy: "ai",
        answeredAt: "2026-10-04T11:21:15.000Z",
      },
      {
        questionId: "q4",
        questionText: "Will you purchase Guard razor or cartridges again?",
        rawAnswer: "No, probably not.",
        normalizedAnswer: "no",
        confidence: 0.96,
        extractedBy: "ai",
        intent: "NEGATIVE_CHURN",
        answeredAt: "2026-10-04T11:21:45.000Z",
      },
      {
        questionId: "q5",
        questionText: "Why will you not purchase Guard again?",
        rawAnswer: "I got small cuts around my neck while shaving.",
        normalizedAnswer: "cuts",
        confidence: 0.92,
        extractedBy: "ai",
        answeredAt: "2026-10-04T11:22:15.000Z",
      },
    ],
  },
  {
    _id: "resp-003",
    responseId: "R-94823",
    surveyId: "surv-guard-01",
    campaignId: "camp-guard-01",
    leadName: "Vikram Patel",
    leadPhone: "+91 97234 56789",
    status: ResponseStatus.COMPLETED,
    completionPercentage: 100,
    durationSeconds: 45,
    overallIntent: "neutral",
    startedAt: "2026-10-04T14:00:00.000Z",
    completedAt: "2026-10-04T14:00:45.000Z",
    answers: [
      {
        questionId: "q1",
        questionText: "Do you remember purchasing a Gillette Guard razor?",
        rawAnswer: "No, I haven't purchased it.",
        normalizedAnswer: "no",
        confidence: 0.99,
        extractedBy: "ai",
        answeredAt: "2026-10-04T14:00:30.000Z",
      },
    ],
  },
];

// ==========================================
// SEED CONVERSATIONS
// ==========================================
export const SEED_CONVERSATIONS: IConversation[] = [
  {
    _id: "conv-001",
    conversationId: "conv-sarah-rahul-01",
    campaignId: "camp-guard-01",
    campaignName: "Guard Razor Consumer Study",
    customerName: "Rahul Sharma",
    customerPhone: "+91 98765 43210",
    agentId: "agent-sarah-01",
    agentName: "Sarah (Voice AI Specialist)",
    status: "completed",
    channel: "voice",
    durationSeconds: 125,
    sentiment: "positive",
    summary: "Customer purchased Gillette Guard last week. Previously went to barber. Expressed high satisfaction and confirmed repeat intent.",
    startedAt: "2026-10-04T10:14:00.000Z",
    endedAt: "2026-10-04T10:16:05.000Z",
    messages: [
      {
        id: "msg-1",
        sender: "ai",
        text: "Namaste Rahul! This is Sarah from Gillette Consumer Research. Do you have 2 quick minutes to share your shaving experience?",
        timestamp: "2026-10-04T10:14:05.000Z",
        channel: "voice",
        aiConfidence: 0.99,
      },
      {
        id: "msg-2",
        sender: "customer",
        text: "Sure, I have a couple of minutes.",
        timestamp: "2026-10-04T10:14:12.000Z",
        channel: "voice",
        detectedIntent: "AGREEMENT",
      },
      {
        id: "msg-3",
        sender: "ai",
        text: "Do you remember purchasing a Gillette Guard razor?",
        timestamp: "2026-10-04T10:14:15.000Z",
        channel: "voice",
        questionId: "q1",
      },
      {
        id: "msg-4",
        sender: "customer",
        text: "Yes, I bought it last week from the local store.",
        timestamp: "2026-10-04T10:14:22.000Z",
        channel: "voice",
        questionId: "q1",
        aiConfidence: 0.98,
        detectedIntent: "YES",
      },
      {
        id: "msg-5",
        sender: "ai",
        text: "Great! What brand did you purchase?",
        timestamp: "2026-10-04T10:14:26.000Z",
        channel: "voice",
        questionId: "q2",
      },
      {
        id: "msg-6",
        sender: "customer",
        text: "It was Gillette Guard single blade razor.",
        timestamp: "2026-10-04T10:14:50.000Z",
        channel: "voice",
        questionId: "q2",
        aiConfidence: 0.96,
      },
      {
        id: "msg-7",
        sender: "ai",
        text: "How did you shave before Guard?",
        timestamp: "2026-10-04T10:14:55.000Z",
        channel: "voice",
        questionId: "q3",
      },
      {
        id: "msg-8",
        sender: "customer",
        text: "I used to go to the local barber shop or use simple disposable razors.",
        timestamp: "2026-10-04T10:15:30.000Z",
        channel: "voice",
        questionId: "q3",
        aiConfidence: 0.94,
      },
      {
        id: "msg-9",
        sender: "ai",
        text: "Understood. Will you purchase Guard razor or cartridges again?",
        timestamp: "2026-10-04T10:15:35.000Z",
        channel: "voice",
        questionId: "q4",
      },
      {
        id: "msg-10",
        sender: "customer",
        text: "Definitely yes, it's very smooth and easy to wash.",
        timestamp: "2026-10-04T10:16:00.000Z",
        channel: "voice",
        questionId: "q4",
        aiConfidence: 0.97,
        detectedIntent: "POSITIVE_INTENT",
      },
      {
        id: "msg-11",
        sender: "ai",
        text: "Thank you so much for your valuable feedback! Have a wonderful day!",
        timestamp: "2026-10-04T10:16:04.000Z",
        channel: "voice",
      },
    ],
  },
];

// ==========================================
// SEED AI AGENTS
// ==========================================
export const SEED_AGENTS: IAIAgent[] = [
  {
    _id: "agent-sarah-01",
    agentId: "AG-SARAH",
    name: "Sarah (Voice AI Specialist)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    description: "Warm, empathetic multilingual voice agent specialized in Indian and global consumer research surveys.",
    status: "online" as any,
    voiceName: "en-IN-Wavenet-D",
    language: "en-IN",
    supportedLanguages: ["en-IN", "hi-IN", "en-US", "en-GB"],
    capabilities: ["voice", "text", "outbound"],
    assignedCampaignIds: ["camp-guard-01", "camp-retention-03"],
    totalConversations: 623,
    successRate: 94.2,
    avgResponseTimeMs: 420,
    systemPrompt: "You are Sarah, a professional and respectful research interviewer. Speak clearly, listen actively, and respect customer time constraints.",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
  },
  {
    _id: "agent-alex-02",
    agentId: "AG-ALEX",
    name: "Alex (B2B Sales Advisor)",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    description: "High-energy consultative sales agent tailored for technical B2B qualification and booking discovery meetings.",
    status: "online" as any,
    voiceName: "en-US-Neural2-J",
    language: "en-US",
    supportedLanguages: ["en-US", "en-GB"],
    capabilities: ["voice", "text", "inbound", "outbound"],
    assignedCampaignIds: ["camp-b2b-saas"],
    totalConversations: 245,
    successRate: 88.5,
    avgResponseTimeMs: 380,
    systemPrompt: "You are Alex, an expert sales development consultant. Uncover prospect pain points, budget authority, and timeline without sounding robotic.",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
  },
];

// ==========================================
// SEED ANALYTICS
// ==========================================
export const SEED_ANALYTICS: Record<string, ICampaignAnalytics> = {
  "camp-guard-01": {
    campaignId: "camp-guard-01",
    totalResponses: 428,
    completedResponses: 382,
    completionRate: 89.2,
    averageDurationSeconds: 114,
    intentDistribution: {
      positive: 68,
      maybe: 14,
      negative: 18,
      neutral: 0,
    },
    questionDropOffs: [
      { questionId: "q1", questionText: "Remember purchasing Guard", reachedCount: 428, dropOffCount: 12, dropOffRate: 2.8 },
      { questionId: "q2", questionText: "Brand purchased", reachedCount: 416, dropOffCount: 8, dropOffRate: 1.9 },
      { questionId: "q3", questionText: "Prior shaving habit", reachedCount: 408, dropOffCount: 14, dropOffRate: 3.4 },
      { questionId: "q4", questionText: "Repeat purchase intent", reachedCount: 394, dropOffCount: 12, dropOffRate: 3.0 },
      { questionId: "q5", questionText: "Reason for non-purchase", reachedCount: 71, dropOffCount: 0, dropOffRate: 0.0 },
    ],
    brandDistribution: [
      { brand: "Gillette Guard", count: 290, percentage: 69.7 },
      { brand: "Other Gillette", count: 75, percentage: 18.0 },
      { brand: "Other Brands", count: 51, percentage: 12.3 },
    ],
    nonPurchaseReasons: [
      { reason: "Cuts / Bleeding", count: 28, percentage: 39.4 },
      { reason: "Blade life short", count: 18, percentage: 25.4 },
      { reason: "Hair getting stuck", count: 12, percentage: 16.9 },
      { reason: "Similar to existing", count: 8, percentage: 11.3 },
      { reason: "Availability in store", count: 5, percentage: 7.0 },
    ],
    responsesOverTime: [
      { date: "Sep 28", responses: 42, completed: 38 },
      { date: "Sep 29", responses: 58, completed: 52 },
      { date: "Sep 30", responses: 65, completed: 59 },
      { date: "Oct 01", responses: 74, completed: 68 },
      { date: "Oct 02", responses: 81, completed: 73 },
      { date: "Oct 03", responses: 55, completed: 49 },
      { date: "Oct 04", responses: 53, completed: 43 },
    ],
    aiInsights: [
      "High repeat purchase intent (68%) strongly correlates with users migrating from traditional barber visits.",
      "Among respondents unwilling to repurchase (18%), 'Cuts / Bleeding' and 'Blade Life' account for 64.8% of churn reasons.",
      "78% of users completing the survey on Mobile Voice completed the flow in under 2 minutes.",
      "Recommendation: Prioritize marketing messaging highlighting safety comb benefits to mitigate cut concerns.",
    ],
  },
};

// ==========================================
// LOCAL STORAGE PERSISTENCE UTILITIES
// ==========================================
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read from localStorage for key ${key}`, err);
  }
  return defaultValue;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save to localStorage for key ${key}`, err);
  }
}

export const mockStore = {
  getCampaigns: (): ICampaign[] => getStored("campaigns", SEED_CAMPAIGNS),
  saveCampaigns: (data: ICampaign[]) => setStored("campaigns", data),

  getSurveys: (): Record<string, ISurvey> => getStored("surveys", SEED_SURVEYS),
  saveSurveys: (data: Record<string, ISurvey>) => setStored("surveys", data),

  getResponses: (): ISurveyResponse[] => getStored("responses", SEED_RESPONSES),
  saveResponses: (data: ISurveyResponse[]) => setStored("responses", data),

  getConversations: (): IConversation[] => getStored("conversations", SEED_CONVERSATIONS),
  saveConversations: (data: IConversation[]) => setStored("conversations", data),

  getAgents: (): IAIAgent[] => getStored("agents", SEED_AGENTS),
  saveAgents: (data: IAIAgent[]) => setStored("agents", data),

  getAnalytics: (): Record<string, ICampaignAnalytics> => getStored("analytics", SEED_ANALYTICS),
  saveAnalytics: (data: Record<string, ICampaignAnalytics>) => setStored("analytics", data),
};
