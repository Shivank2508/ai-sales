import { Types } from "mongoose";

import type {
    CreateLeadInput,
    LeadStatus,
} from "./lead.types.js";
import { LeadRepositry } from "./lead.repository.js";
import { LeadModel } from "./lead.model.js";
import { CampaignLeadModel, CampaignLeadStatus, CampaignActionType } from "../campaign/models/CampaignLead.model.js";
import { CampaignModel } from "../campaign/models/Campaign.model.js";

export class LeadService {
    constructor(
        private readonly leadRepository =
            new LeadRepositry()
    ) { }

    async createLead(input: CreateLeadInput & { campaignId?: string }) {
        let lead;
        if (input.email) {
            const existingLead =
                await this.leadRepository.findByEmail(
                    input.email.toLowerCase()
                );

            if (existingLead) {
                lead = existingLead;
            }
        }

        if (!lead) {
            lead = await this.leadRepository.create(input);
        }

        if (input.campaignId && Types.ObjectId.isValid(input.campaignId)) {
            const campId = new Types.ObjectId(input.campaignId);
            const leadId = new Types.ObjectId((lead as any)._id);
            await CampaignLeadModel.findOneAndUpdate(
                { campaignId: campId, leadId },
                { campaignId: campId, leadId, status: CampaignLeadStatus.PENDING, action: CampaignActionType.CALL },
                { upsert: true, new: true }
            );
            await CampaignModel.findByIdAndUpdate(campId, {
                $addToSet: { "audience.leadIds": leadId },
                $inc: { "stats.totalLeads": 1, "stats.eligibleLeads": 1 }
            });
        }

        return lead;
    }

    async importLeads(leads: Array<CreateLeadInput & { campaignId?: string }>, campaignId?: string) {
        const savedLeads: any[] = [];
        for (const l of leads) {
            const targetCampId = l.campaignId || campaignId;
            let lead: any = null;
            if (l.email) {
                lead = await this.leadRepository.findByEmail(l.email.toLowerCase());
            }
            if (!lead && l.phone) {
                lead = await LeadModel.findOne({ phone: l.phone.trim() }).lean().exec();
            }
            if (!lead) {
                lead = await this.leadRepository.create(l);
            }
            if (targetCampId && Types.ObjectId.isValid(targetCampId)) {
                const cId = new Types.ObjectId(targetCampId);
                const lId = new Types.ObjectId((lead as any)._id);
                await CampaignLeadModel.findOneAndUpdate(
                    { campaignId: cId, leadId: lId },
                    { campaignId: cId, leadId: lId, status: CampaignLeadStatus.PENDING, action: CampaignActionType.CALL },
                    { upsert: true, new: true }
                );
                await CampaignModel.findByIdAndUpdate(cId, {
                    $addToSet: { "audience.leadIds": lId },
                });
            }
            savedLeads.push(lead);
        }

        if (campaignId && Types.ObjectId.isValid(campaignId)) {
            const count = await CampaignLeadModel.countDocuments({ campaignId: new Types.ObjectId(campaignId) });
            await CampaignModel.findByIdAndUpdate(campaignId, {
                "stats.totalLeads": count,
                "stats.eligibleLeads": count,
            });
        }

        return {
            importedCount: savedLeads.length,
            leads: savedLeads,
        };
    }

    async getLeads(campaignId?: string) {
        if (campaignId && Types.ObjectId.isValid(campaignId)) {
            const campaignLeads = await CampaignLeadModel.find({
                campaignId: new Types.ObjectId(campaignId)
            }).populate("leadId").lean().exec();

            const leads = campaignLeads
                .map((cl: any) => {
                    if (cl.leadId) {
                        return {
                            ...cl.leadId,
                            campaignStatus: cl.status,
                            campaignAction: cl.action,
                            campaignLeadId: cl._id,
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            if (leads.length > 0) return leads;
        }
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
        input: any
    ) {
        this.validateId(id);

        const lead =
            await this.leadRepository.updateById(
                id,
                input
            );

        if (!lead) {
            throw new Error(
                "Lead not found",
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

    async updateStatusFromConversation(leadId: string, status: LeadStatus) {
        const lead = await this.leadRepository.findById(leadId);
        if (!lead) {
            throw new Error("Lead not found");
        }
        return this.leadRepository.updateById(leadId, {
            status,
        });
    }
}