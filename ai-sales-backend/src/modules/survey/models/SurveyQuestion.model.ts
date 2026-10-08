import mongoose, { Document, Model, Schema } from "mongoose";

export enum QuestionType {
    TEXT = "text",
    LONG_TEXT = "long_text",
    SINGLE_CHOICE = "single_choice",
    MULTIPLE_CHOICE = "multiple_choice",
    YES_NO = "yes_no",
    NUMBER = "number",
    RATING = "rating",
    SCALE = "scale",
    DATE = "date",
    TIME = "time",
    FREQUENCY = "frequency",
    PRICE = "price",
    PRODUCT = "product",
}

export enum QuestionAction {
    NEXT = "next",
    END_SURVEY = "end_survey",
    SKIP_TO = "skip_to",
}

export interface IQuestionOption {
    value: string;
    label: string;
}

export interface IQuestionCondition {
    field: string;
    operator:
        | "equals"
        | "not_equals"
        | "contains"
        | "not_contains"
        | "in"
        | "not_in"
        | "greater_than"
        | "less_than"
        | "greater_than_or_equal"
        | "less_than_or_equal"
        | "is_empty"
        | "is_not_empty"
        | string;
    value?: any;
    action: QuestionAction | string;
    nextQuestionId?: string;
}

export interface ISurveyQuestion {
    surveyId: mongoose.Types.ObjectId;
    questionId: string;
    order: number;
    type: QuestionType | string;
    text: string;
    aiPrompt?: string;
    required: boolean;
    allowMultiple?: boolean;
    options?: IQuestionOption[];
    conditions?: IQuestionCondition[];
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ISurveyQuestionDocument = ISurveyQuestion & Document;

const QuestionOptionSchema = new Schema<IQuestionOption>(
    {
        value: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
);

const QuestionConditionSchema = new Schema<IQuestionCondition>(
    {
        field: {
            type: String,
            default: "answer",
            required: false,
        },
        operator: {
            type: String,
            required: true,
        },
        value: {
            type: Schema.Types.Mixed,
        },
        action: {
            type: String,
            default: QuestionAction.NEXT,
        },
        nextQuestionId: String,
    },
    {
        _id: false,
    }
);

const SurveyQuestionSchema = new Schema<ISurveyQuestionDocument>(
    {
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: "Survey",
            required: true,
            index: true,
        },
        questionId: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        aiPrompt: String,
        required: {
            type: Boolean,
            default: true,
        },
        allowMultiple: Boolean,
        options: {
            type: [QuestionOptionSchema],
            default: undefined,
        },
        conditions: {
            type: [QuestionConditionSchema],
            default: undefined,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

SurveyQuestionSchema.index({
    surveyId: 1,
    order: 1,
});

SurveyQuestionSchema.index({
    surveyId: 1,
    questionId: 1,
});

export const SurveyQuestionModel: Model<ISurveyQuestionDocument> =
    (mongoose.models.SurveyQuestion as Model<ISurveyQuestionDocument>) ||
    mongoose.model<ISurveyQuestionDocument>(
        "SurveyQuestion",
        SurveyQuestionSchema
    );