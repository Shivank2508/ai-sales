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
        businessId?: string;
        type?: CampaignType;
        product?: string;
        createdBy?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const bId = data.businessId && mongoose.Types.ObjectId.isValid(data.businessId)
            ? new mongoose.Types.ObjectId(data.businessId)
            : new mongoose.Types.ObjectId();
        const uId = data.createdBy && mongoose.Types.ObjectId.isValid(data.createdBy)
            ? new mongoose.Types.ObjectId(data.createdBy)
            : new mongoose.Types.ObjectId();

        const campaign = await this.campaignRepository.create({
            name: data.name,
            description: data.description,
            businessId: bId,
            type: data.type || CampaignType.SURVEY,
            product: data.product,
            createdBy: uId,
            startDate: data.startDate,
            endDate: data.endDate,
            status: CampaignStatus.DRAFT,
        });
        return campaign;
    }

    async getAllCampaigns() {
        return this.campaignRepository.findAll();
    }

    async getCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.findById(campaignId)
        if (!campaign) {
            throw new Error("Campaign not found");
        }
        return campaign;
    }

    async getBusinessCampaigns(businessId: string) {
        return this.campaignRepository.findByBusinessId(
            businessId
        );
    }
    async updateCampaign(campaignId: string, data: Partial<{
        name: string,
        description: string;
        product: string;
        startDate: Date;
        endDate: Date;
    }>
    ) {
        const campaign = await this.campaignRepository.update(campaignId, data)

        if (!campaign) { throw new Error("Campaign not found"); }

        return campaign
    }

    async publishCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.findById(campaignId)

        if (!campaign) { throw new Error("Campaign not found"); }

        if (!campaign.surveyId) {
            throw new Error(
                "Campaign cannot be published without a survey"
            );
        }

        const survey = await this.surveyRepository.findById(campaign.surveyId.toString());
        if (!survey) {
            throw new Error("Campaign survey not found");
        }
        const updated =
            await this.campaignRepository.updateStatus(
                campaignId,
                CampaignStatus.ACTIVE
            );

        return updated;
    }

    async pauseCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.updateStatus(campaignId, CampaignStatus.PAUSED);
        if (!campaign) {
            throw new Error("Campaign not found");
        }

        return campaign;
    }

    async archiveCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.updateStatus(campaignId, CampaignStatus.ARCHIVED);

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        return campaign;
    }

    async deleteCampaign(campaignId: string) {
        const deleted = await this.campaignRepository.delete(campaignId);
        if (!deleted) { throw new Error("Campaign not found"); }

        return {
            success: true,
        };
    }
    async attachSurvey(campaignId: string, surveyId: string) {
        const campaign = await this.campaignRepository.findById(campaignId);

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        const survey = await this.surveyRepository.findById(surveyId)
        if (!survey) {
            throw new Error("survey not found");
        }


        if (survey.campaignId.toString() !== campaignId) {
            throw new Error(
                "Survey does not belong to this campaign"
            );
        }
        return this.campaignRepository.update(
            campaignId,
            {
                surveyId: new mongoose.Types.ObjectId(surveyId),
            }
        );
    }

    async validateCampaignForPublish(campaignId: string) {
        const campaign = await this.campaignRepository.findById(campaignId);

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        if (!campaign.surveyId) {
            throw new Error(
                "Campaign does not have a survey"
            );
        }

        const survey = await this.surveyRepository.findById(campaign.surveyId.toString());

        if (!survey) {
            throw new Error(
                "Survey not found"
            );
        }

        return {
            valid: true,
            campaign,
            survey,
        };

    }

}