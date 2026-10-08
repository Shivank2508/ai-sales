import mongoose, { Document, Model, Schema } from "mongoose";

export enum QuestionType {
<<<<<<< HEAD
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
=======
    SINGLE_CHOICE = "single_choice",
    MULTIPLE_CHOICE = "multiple_choice",
    TEXT = "text",
    NUMBER = "number",
    YES_NO = "yes_no",
    RATING = "rating",
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}

export enum QuestionAction {
    NEXT = "next",
    END_SURVEY = "end_survey",
<<<<<<< HEAD
    SKIP_TO = "skip_to",
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
}

export interface IQuestionOption {
    value: string;
    label: string;
}

export interface IQuestionCondition {
    field: string;
    operator:
<<<<<<< HEAD
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
=======
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "in"
    | "not_in";

    value: string | string[];
    action: QuestionAction;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
    nextQuestionId?: string;
}

export interface ISurveyQuestion {
    surveyId: mongoose.Types.ObjectId;
    questionId: string;
    order: number;
<<<<<<< HEAD
    type: QuestionType | string;
=======
    type: QuestionType;
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        label: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
<<<<<<< HEAD
);
=======
)

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

const QuestionConditionSchema = new Schema<IQuestionCondition>(
    {
        field: {
            type: String,
<<<<<<< HEAD
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
=======
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

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        questionId: {
            type: String,
            required: true,
        },
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        order: {
            type: Number,
            required: true,
        },
<<<<<<< HEAD
        type: {
            type: String,
            required: true,
        },
=======

        type: {
            type: String,
            enum: Object.values(QuestionType),
            required: true,
        },

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        text: {
            type: String,
            required: true,
        },
<<<<<<< HEAD
        aiPrompt: String,
=======

        aiPrompt: String,

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        required: {
            type: Boolean,
            default: true,
        },
<<<<<<< HEAD
        allowMultiple: Boolean,
=======

        allowMultiple: Boolean,

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        options: {
            type: [QuestionOptionSchema],
            default: undefined,
        },
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        conditions: {
            type: [QuestionConditionSchema],
            default: undefined,
        },
<<<<<<< HEAD
=======

>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);
<<<<<<< HEAD

=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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