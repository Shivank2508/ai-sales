export const LEAD_STATUSES = [
    "NEW",
    "QUALIFIED",
    "CONTACTED",
    "INTRESTED",
    "MEETING_BOOKED",
    "WON",
    "LOST"
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export interface CreateLeadInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyName?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    location?: string;

    source?: string;
    notes?: string;

}