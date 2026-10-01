import mongoose from "mongoose";
import { SurveyRepository } from "../../survey/repositories/SurveyRepository";
import { CampaignStatus, CampaignType } from "../models/Campaign.model";
import { CampaignRepository } from "../repositories/CampaignRepository";

export class CampaignService {
    private readonly campaignRepository = new CampaignRepository();
    private readonly surveyRepository = new SurveyRepository();

    async createCampaign(data: {
        name: string;
        description?: string;
        businessId: string;
        type: CampaignType;
        product?: string;
        createdBy: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const campaign = await this.campaignRepository.create({
            name: data.name,
            description: data.description,
            businessId: new mongoose.Types.ObjectId(data.businessId),
            type: data.type,
            product: data.product,
            createdBy: new mongoose.Types.ObjectId(
                data.createdBy
            ),
            startDate: data.startDate,
            endDate: data.endDate,
            status: CampaignStatus.DRAFT,
        })
    }
}