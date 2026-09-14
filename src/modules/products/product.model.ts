import { model, Schema, type InferSchemaType, } from "mongoose";
import { PRODUCT_STATUSES } from "./product.types";


const featureSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    _id: false,
})

const pricingSchema = new Schema({
    plan: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        min: 0
    },
    currency: {
        type: String,
        trim: true
    },
    billingPeriod: {
        type: String,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },
}, {
    _id: false,
})
const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    features: {
        type: [featureSchema],
        default: []
    },
    benefit: {
        type: [String],
        default: []
    },
    targetcustomer: {
        type: [String],
        default: [],
    },
    painPointSolved: {
        type: [String],
        default: []
    },
    pricing: {
        type: [pricingSchema],
        default: []
    },
    salesNotes: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: PRODUCT_STATUSES,
        default: "DRAFT",
    },

}, {
    timestamps: true,
    versionKey: false,
}
)

export type Product = InferSchemaType<typeof productSchema>

export const ProductModel = model("Product", productSchema)