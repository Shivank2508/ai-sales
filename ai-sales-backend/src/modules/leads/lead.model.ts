import { model, Schema, type InferSchemaType } from "mongoose";
import { LEAD_STATUSES } from "./lead.types";

const leadSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },

    lastName: {
        type: String,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    jobTitle: {
        type: String,
        trim: true,
    },

    companyName: {
        type: String,
        trim: true,
    },

    companyWebsite: {
        type: String,
        trim: true,
    },

    industry: {
        type: String,
        trim: true,
    },

    companySize: {
        type: String,
        trim: true,
    },

    location: {
        type: String,
        trim: true,
    },

    source: {
        type: String,
        trim: true,
    },

    notes: {
        type: String,
        trim: true,
    },

    status: {
        type: String,
        enum: LEAD_STATUSES,
        default: "NEW",
    },

    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
    versionKey: false,
})


export type Lead =
    InferSchemaType<typeof leadSchema>;


export const LeadModel =
    model("Lead", leadSchema);