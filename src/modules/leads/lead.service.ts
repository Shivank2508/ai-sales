import { Types } from "mongoose";





import type {
    CreateLeadInput,
} from "./lead.types.js";
import { LeadRepositry } from "./lead.repository.js";

export class LeadService {
    constructor(
        private readonly leadRepository =
            new LeadRepositry()
    ) { }

    async createLead(input: CreateLeadInput) {
        if (input.email) {
            const existingLead =
                await this.leadRepository.findByEmail(
                    input.email.toLowerCase()
                );

            if (existingLead) {
                throw new Error(
                    // 409,
                    "A lead with this email already exists",
                    // ErrorCode.LEAD_ALREADY_EXISTS
                );
            }
        }

        return this.leadRepository.create(input);
    }

    async getLeads() {
        return this.leadRepository.findAll();
    }

    async getLead(id: string) {
        this.validateId(id);

        const lead =
            await this.leadRepository.findById(id);

        if (!lead) {
            throw new Error(
                // 404,
                "Lead not found",
                // ErrorCode.LEAD_NOT_FOUND
            );
        }

        return lead;
    }

    async updateLead(
        id: string,
    ) {
        this.validateId(id);

        const lead =
            await this.leadRepository.findById(
                id,
            );

        if (!lead) {
            throw new Error(
                // 404,
                "Lead not found",
                // ErrorCode.LEAD_NOT_FOUND
            );
        }

        return lead;
    }

    async deleteLead(id: string) {
        this.validateId(id);

        const lead =
            await this.leadRepository.deleteById(id);

        if (!lead) {
            throw new Error(
                // 404,
                "Lead not found",
                // ErrorCode.LEAD_NOT_FOUND
            );
        }

        return lead;
    }

    private validateId(id: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error(
                // 400,
                "Invalid lead ID",
                // ErrorCode.VALIDATION_ERROR
            );
        }
    }
}