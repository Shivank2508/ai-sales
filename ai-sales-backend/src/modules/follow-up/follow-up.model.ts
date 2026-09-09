import { model, Schema } from "mongoose";
import { FollowUpPriority, FollowUpStatus, FollowUpType } from "./follow-up.types";

const followUpSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
    },
    task: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: Object.values(
            FollowUpType
        ),
        required: true,
    },

    priority: {
        type: String,
        enum: Object.values(
            FollowUpPriority
        ),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(
            FollowUpStatus
        ),
        default:
            FollowUpStatus.PENDING,
        index: true,
    },
    dueDate: {
        type: Date,
        index: true,
    },

    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
}
)

export const FollowUpModel = model("FollowUp", followUpSchema)