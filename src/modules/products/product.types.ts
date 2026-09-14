export const PRODUCT_STATUSES = [
    "DRAFT",
    "ACTIVE",
    "INACTIVE",
] as const;

export type ProductStatus =
    (typeof PRODUCT_STATUSES)[number];

export interface ProductFeature {
    name: string;
    description: string;
}

export interface ProductPricing {
    plan: string;
    price: string;
    currency?: string;
    billingPeriod?: string;
    description?: string;

}



export interface CreateProductInput {
    name: string;
    description: string;
    category: string;
    features: ProductFeature[],
    benifits: string[]
    targetCustomer: string[],
    painPointSolved: string[],
    pricing: ProductPricing[],
    salesNotes?: string;

}


export interface UpdateProductInput
    extends Partial<CreateProductInput> {
    status?: ProductStatus
}