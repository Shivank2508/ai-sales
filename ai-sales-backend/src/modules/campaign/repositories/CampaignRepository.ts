import mongoose from "mongoose";
import { CampaignModel, CampaignStatus, ICampaign, ICampaignDocument } from "../models/Campaign.model";

export class CampaignRepository {
    async create(
        data: Partial<ICampaign>
    ): Promise<ICampaignDocument> {
        return CampaignModel.create(data);
    }

    async findById(campaignId: string): Promise<ICampaign | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return null;
        }

        return CampaignModel.findById(campaignId).exec();
    }
    async findAll(): Promise<ICampaign[]> {
        return CampaignModel.find()
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByBusinessId(
        businessId: string
    ): Promise<ICampaign[]> {
        return CampaignModel.find({
            businessId,
        })
            .sort({ createdAt: -1 })
            .exec();
    }

    async update(
        campaignId: string,
        data: Partial<ICampaign>
    ): Promise<ICampaign | null> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return null;
        }

        return CampaignModel.findByIdAndUpdate(
            campaignId,
            {
                $set: data,
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async updateStatus(
        campaignId: string,
        status: CampaignStatus
    ): Promise<ICampaign | null> {
        return this.update(campaignId, {
            status,
        });
    }

    async delete(
        campaignId: string
    ): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return false;
        }

        const result = await CampaignModel.deleteOne({
            _id: campaignId,
        });

        return result.deletedCount === 1;
    }
}