import mongoose, { Document, Model, Schema } from "mongoose";

export enum CampaignType {
    SURVEY = "survey",
    SALES = "sales",
    FEEDBACK = "feedback",
    PRODUCT_RESEARCH = "product_research",
    CUSTOMER_RETENTION = "customer_retention",
}

export enum CampaignStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    RUNNING = "running",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    FAILED = "failed",
    ARCHIVED = "archived",
}

export interface ICampaignAudience {
    leadIds?: mongoose.Types.ObjectId[];
    filters?: {
        status?: string[];
        industry?: string[];
        location?: string[];
        minScore?: number;
        maxScore?: number;
        tags?: string[];
    };
}

export interface ICampaignStats {
    totalLeads: number;
    eligibleLeads: number;
    startedLeads: number;
    contactedLeads: number;
    completedLeads: number;
    failedLeads: number;
    skippedLeads: number;
    conversionRate: number;
    completionRate: number;
    responseRate: number;
}

export interface ICampaign {
    name: string;
    description?: string;
    businessId: mongoose.Types.ObjectId;
    type: CampaignType;
    status: CampaignStatus;
    action?: "CALL" | "SURVEY" | "FOLLOW_UP" | "AI_MESSAGE" | "EMAIL" | string;
    productId?: mongoose.Types.ObjectId;
    product?: string;
    surveyId?: mongoose.Types.ObjectId;
    audience?: ICampaignAudience;
    schedule?: {
        startDate?: Date;
        endDate?: Date;
        cronExpression?: string;
        timezone?: string;
    };
    stats?: ICampaignStats;
    startDate?: Date;
    endDate?: Date;
    createdBy: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ICampaignDocument = ICampaign & Document;

const AudienceSchema = new Schema<ICampaignAudience>(
    {
        leadIds: [{ type: Schema.Types.ObjectId, ref: "Lead" }],
        filters: {
            status: [String],
            industry: [String],
            location: [String],
            minScore: Number,
            maxScore: Number,
            tags: [String],
        },
    },
    { _id: false }
);

const StatsSchema = new Schema<ICampaignStats>(
    {
        totalLeads: { type: Number, default: 0 },
        eligibleLeads: { type: Number, default: 0 },
        startedLeads: { type: Number, default: 0 },
        contactedLeads: { type: Number, default: 0 },
        completedLeads: { type: Number, default: 0 },
        failedLeads: { type: Number, default: 0 },
        skippedLeads: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        responseRate: { type: Number, default: 0 },
    },
    { _id: false }
);

const CampaignSchema = new Schema<ICampaignDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(CampaignType),
            default: CampaignType.SURVEY,
        },
        status: {
            type: String,
            enum: Object.values(CampaignStatus),
            default: CampaignStatus.DRAFT,
            index: true,
        },
        action: {
            type: String,
            default: "SURVEY",
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
        },
        product: {
            type: String,
            trim: true,
        },
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
            index: true,
        },
        audience: {
            type: AudienceSchema,
            default: () => ({ leadIds: [], filters: {} }),
        },
        schedule: {
            startDate: Date,
            endDate: Date,
            cronExpression: String,
            timezone: { type: String, default: "UTC" },
        },
        stats: {
            type: StatsSchema,
            default: () => ({}),
        },
        startDate: Date,
        endDate: Date,
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

CampaignSchema.index({
    businessId: 1,
    status: 1,
});

export const CampaignModel: Model<ICampaignDocument> =
    (mongoose.models.Campaign as Model<ICampaignDocument>) ||
    mongoose.model<ICampaignDocument>("Campaign", CampaignSchema);