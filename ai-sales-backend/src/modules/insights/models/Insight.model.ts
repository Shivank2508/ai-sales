import mongoose, { Document, Model, Schema } from "mongoose";

export enum InsightType {
    OPPORTUNITY = "OPPORTUNITY",
    RISK = "RISK",
    TREND = "TREND",
    ANOMALY = "ANOMALY",
    RECOMMENDATION = "RECOMMENDATION",
}

export enum InsightImpact {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW",
}

export interface IBusinessInsight {
    type: InsightType | string;
    title: string;
    description: string;
    impact: InsightImpact | string;
    metricChange?: string;
    recommendedAction: string;
    targetModule?: "CAMPAIGN" | "SURVEY" | "AGENT" | "LEADS" | "PRODUCT";
    targetId?: string;
    dataPoints?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type IBusinessInsightDocument = IBusinessInsight & Document;

const BusinessInsightSchema = new Schema<IBusinessInsightDocument>(
    {
        type: {
            type: String,
            enum: Object.values(InsightType),
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        impact: {
            type: String,
            enum: Object.values(InsightImpact),
            default: InsightImpact.MEDIUM,
        },
        metricChange: String,
        recommendedAction: {
            type: String,
            required: true,
        },
        targetModule: {
            type: String,
            enum: ["CAMPAIGN", "SURVEY", "AGENT", "LEADS", "PRODUCT"],
        },
        targetId: String,
        dataPoints: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

export const BusinessInsightModel: Model<IBusinessInsightDocument> =
    (mongoose.models.BusinessInsight as Model<IBusinessInsightDocument>) ||
    mongoose.model<IBusinessInsightDocument>("BusinessInsight", BusinessInsightSchema);
