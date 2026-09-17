import mongoose, { Schema } from "mongoose";
export enum CampaignType {
    SURVEY = "survey",
    SALES = "sales",
    FEEDBACK = "feedback",
    PRODUCT_RESEARCH = "product_research",
    CUSTOMER_RETENTION = "customer_retention"
}

export enum CampaignStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    ARCHIVED = "archived"
}
export interface ICampaign extends Document {
    name: string;
    description?: string;
    businessId: mongoose.Types.ObjectId;
    type: CampaignType;
    status: CampaignStatus;
    product?: string;
    startDate?: Date;
    endDate?: Date;
    surveyId?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
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
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(CampaignStatus),
            default: CampaignStatus.DRAFT,
            index: true,
        },

        product: {
            type: String,
            trim: true,
        },
        startDate: Date,
        endDate: Date,

        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

CampaignSchema.index({
    businessId: 1,
    status: 1,
});

export const CampaignModel =
    mongoose.models.Campaign ||
    mongoose.model<ICampaign>("Campaign", CampaignSchema);