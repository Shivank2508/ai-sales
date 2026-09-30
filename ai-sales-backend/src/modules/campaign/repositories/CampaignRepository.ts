import { CampaignModel, ICampaign, ICampaignDocument } from "../models/Campaign.model";

export class CampaignRepository {
    async create(
        data: Partial<ICampaign>
    ): Promise<ICampaignDocument> {
        return CampaignModel.create(data);
    }
}