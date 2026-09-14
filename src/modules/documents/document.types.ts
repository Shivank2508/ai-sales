export const DOCUMENT_STATUSES = [
    "UPLOADED",
    "PROCESSING",
    "READY",
    "FAILED",
] as const;

export type DocumentStatus =
    (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
    "PRODUCT_MANUAL",
    "SALES_PLAYBOOK",
    "PRICING",
    "COMPETITOR",
    "CASE_STUDY",
    "FAQ",
    "OTHER",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface CreateDocumentInput {
    productId: string;
    name: string;
    type: DocumentType;

    originalName: string;
    storedName: string;
    filePath: string;
    mimeType: string;

    filesize: number;   // Required
}