import { model, Schema } from "mongoose";
import { CHAT_ROLES } from "./chat.types";

const MessageSchema = new Schema(
    {
        role: {
            type: String,
            enum: CHAT_ROLES,
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,

            default: Date.now,
        },
    }, {
    _id: false,
}
)

const ConversationSchema =
    new Schema(
        {
            productId: {
                type: Schema.Types.ObjectId,

                ref: "Product",

                required: true,

                index: true,
            },

            title: {
                type: String,

                trim: true,
            },

            messages: {
                type: [MessageSchema],

                default: [],
            },
        },
        {
            timestamps: true,
        }
    );
ConversationSchema.index({
    productId: 1,
    updatedAt: -1,
});

export const ConversationModel =
    model(
        "Conversation",
        ConversationSchema
    );