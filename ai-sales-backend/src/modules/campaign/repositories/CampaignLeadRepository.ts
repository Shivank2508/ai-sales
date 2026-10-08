import mongoose from "mongoose";
import {
    CampaignLeadModel,
    CampaignLeadStatus,
    ICampaignLead,
    ICampaignLeadDocument,
} from "../models/CampaignLead.model";

export class CampaignLeadRepository {
    async create(data: Partial<ICampaignLead>): Promise<ICampaignLeadDocument> {
        return CampaignLeadModel.create(data);
    }

    async upsertLeadExecution(
        campaignId: string,
        leadId: string,
        data: Partial<ICampaignLead>
    ): Promise<ICampaignLeadDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId) || !mongoose.Types.ObjectId.isValid(leadId)) {
            return null;
        }

        return CampaignLeadModel.findOneAndUpdate(
            {
                campaignId: new mongoose.Types.ObjectId(campaignId),
                leadId: new mongoose.Types.ObjectId(leadId),
            },
            {
                $set: {
                    ...data,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            {
                new: true,
                upsert: true,
            }
        ).exec();
    }

    async findByCampaignAndLead(campaignId: string, leadId: string): Promise<ICampaignLeadDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId) || !mongoose.Types.ObjectId.isValid(leadId)) {
            return null;
        }

        return CampaignLeadModel.findOne({
            campaignId: new mongoose.Types.ObjectId(campaignId),
            leadId: new mongoose.Types.ObjectId(leadId),
        }).exec();
    }

    async findByCampaignId(campaignId: string): Promise<ICampaignLeadDocument[]> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return [];
        }

        return CampaignLeadModel.find({
            campaignId: new mongoose.Types.ObjectId(campaignId),
        })
            .populate("leadId")
            .sort({ createdAt: -1 })
            .exec();
    }

    async updateStatus(
        campaignId: string,
        leadId: string,
        status: CampaignLeadStatus,
        extraData: Partial<ICampaignLead> = {}
    ): Promise<ICampaignLeadDocument | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId) || !mongoose.Types.ObjectId.isValid(leadId)) {
            return null;
        }

        return CampaignLeadModel.findOneAndUpdate(
            {
                campaignId: new mongoose.Types.ObjectId(campaignId),
                leadId: new mongoose.Types.ObjectId(leadId),
            },
            {
                $set: {
                    status,
                    ...extraData,
                    updatedAt: new Date(),
                },
            },
            {
                new: true,
            }
        ).exec();
    }

    async getCampaignLeadStats(campaignId: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        contacted: number;
        completed: number;
        failed: number;
        skipped: number;
    }> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return { total: 0, pending: 0, inProgress: 0, contacted: 0, completed: 0, failed: 0, skipped: 0 };
        }

        const campaignIdObj = new mongoose.Types.ObjectId(campaignId);
        const counts = await CampaignLeadModel.aggregate([
            { $match: { campaignId: campaignIdObj } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const stats = {
            total: 0,
            pending: 0,
            inProgress: 0,
            contacted: 0,
            completed: 0,
            failed: 0,
            skipped: 0,
        };

        for (const item of counts) {
            stats.total += item.count;
            if (item._id === CampaignLeadStatus.PENDING) stats.pending = item.count;
            if (item._id === CampaignLeadStatus.IN_PROGRESS) stats.inProgress = item.count;
            if (item._id === CampaignLeadStatus.CONTACTED) stats.contacted = item.count;
            if (item._id === CampaignLeadStatus.COMPLETED) stats.completed = item.count;
            if (item._id === CampaignLeadStatus.FAILED) stats.failed = item.count;
            if (item._id === CampaignLeadStatus.SKIPPED) stats.skipped = item.count;
        }

        return stats;
    }
}
