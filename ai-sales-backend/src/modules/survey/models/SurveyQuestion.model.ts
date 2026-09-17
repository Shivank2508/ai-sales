import mongoose, { Schema } from "mongoose";

export enum QuestionType {
    SINGLE_CHOICE = "single_choice",
    MULTIPLE_CHOICE = "multiple_choice",
    TEXT = "text",
    NUMBER = "number",
    YES_NO = "yes_no",
    RATING = "rating",
}

export enum QuestionAction {
    NEXT = "next",
    END_SURVEY = "end_survey",
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
    | "not_in";

    value: string | string[];
    action: QuestionAction;
    nextQuestionId?: string;
}

export interface ISurveyQuestion extends Document {
    surveyId: mongoose.Types.ObjectId;
    questionId: string;
    order: number;
    type: QuestionType;
    text: string;
    aiPrompt?: string;
    required: boolean;
    allowMultiple?: boolean;
    options?: IQuestionOption[];
    conditions?: IQuestionCondition[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date
}

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
)


const QuestionConditionSchema = new Schema<IQuestionCondition>(
    {
        field: {
            type: String,
            required: true,
        },

        operator: {
            type: String,
            enum: [
                "equals",
                "not_equals",
                "contains",
                "not_contains",
                "in",
                "not_in",
            ],
            required: true,
        },

        value: {
            type: Schema.Types.Mixed,
            required: true,
        },

        action: {
            type: String,
            enum: Object.values(QuestionAction),
            required: true,
        },

        nextQuestionId: String,
    },
    {
        _id: false,
    }
);

const SurveyQuestionSchema = new Schema<ISurveyQuestion>(
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
            enum: Object.values(QuestionType),
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

export const SurveyQuestionModel =
    mongoose.models.SurveyQuestion ||
    mongoose.model<ISurveyQuestion>(
        "SurveyQuestion",
        SurveyQuestionSchema
    );