import { z } from "zod";

export const createLeadSchema = z.object({
    firstName: z.string().trim().min(1),

    lastName: z.string().trim().optional(),

    email: z.string().email().optional(),

    phone: z.string().trim().optional(),

    jobTitle: z.string().trim().optional(),

    companyName: z.string().trim().optional(),

    companyWebsite: z.string().url().optional(),

    industry: z.string().trim().optional(),

    companySize: z.string().trim().optional(),

    location: z.string().trim().optional(),

    source: z.string().trim().optional(),

    notes: z.string().trim().optional(),
});

export type CreateLeadBody =
    z.infer<typeof createLeadSchema>;