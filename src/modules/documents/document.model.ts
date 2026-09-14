import { type InferSchemaType, model, Schema } from "mongoose";
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from "./document.types";

const documentSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: DOCUMENT_TYPES,
        required: true
    },
    originalName: {
        type: String,
        required: true,
    },
    storedName: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: DOCUMENT_STATUSES,
        default: "UPLOADED",
    },
    chunkCount: {
        type: Number,
        default: 0,
    },

    errorMessage: {
        type: String,
    },

},
    {
        timestamps: true,
        versionKey: false,
    })


export type Document = InferSchemaType<typeof documentSchema>

export const DocumentModel =
    model("Document", documentSchema);